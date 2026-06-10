#include <GL/gl.h>
#include <GL/glu.h>
#include <SDL/SDL.h>
#include "ui_disp.h"
#include "globals.h"
#include "ppm.h"
#include "stdio.h"

#define Left(c, sc, div)   ((float)c + ((float)sc / (float)div) - ((float)GRID_W / 2.0))
#define Right(c, sc, div)  (Left(c, (sc + 1), div))
#define Top(r, sr, div)    ((float)r + ((float)sr / (float)div) - ((float)GRID_H / 2.0))
#define Bottom(r, sr, div) (Top(r, (sr + 1), div))
#define TexLeft(sc, div)   ((float)sc/(float)div)
#define TexRight(sc, div)  (TexLeft((sc + 1), div))
#define TexTop(sr, div)    ((float)sr/(float)div)
#define TexBottom(sr, div) (TexTop((sr + 1), div))

IMAGE pit_image;
IMAGE grass_image;
GLuint pit_texture;
GLuint grass_texture;

void ui_disp_init()
{
	SDL_Surface* surface;

	static float ambient[] = {0.0, 0.0, 0.0, 1.0};	/* We don't like ambient light */
	static float specular[] = {0.3, 0.3, 0.3, 1.0};
	static float shininess[] = {2.0};

	/* SDL display init */
	SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
	SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 16);
	SDL_GL_SetAttribute(SDL_GL_RED_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_GREEN_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_BLUE_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_ALPHA_SIZE, 8);

	surface = SDL_SetVideoMode(gScreenW, gScreenH, 0, SDL_OPENGL);
	if(surface == NULL)
	{
		printf("Failed to get video surface: %s\n", SDL_GetError());
		exit(1);
	}

	SDL_WM_SetCaption("Pitz!", NULL);

	/* Size and shape of view vol */
	glViewport(0, 0, gScreenW, gScreenH);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	gluPerspective(45.0, (float)gScreenW/(float)gScreenH, 0.1, 100.0);

	/* Lighting */
	glLightModelfv(GL_LIGHT_MODEL_AMBIENT, ambient);
	glLightModeli(GL_LIGHT_MODEL_LOCAL_VIEWER, 1);
 //       glLightModeli(GL_LIGHT_MODEL_COLOR_CONTROL, GL_SEPARATE_SPECULAR_COLOR);

	glLightf(GL_LIGHT0, GL_SPOT_EXPONENT, 1.0);
	glLightf(GL_LIGHT0, GL_SPOT_CUTOFF,   90.0);
	glLightf(GL_LIGHT0, GL_CONSTANT_ATTENUATION,  0.5);
	glLightf(GL_LIGHT0, GL_LINEAR_ATTENUATION,    0.1);
	glLightf(GL_LIGHT0, GL_QUADRATIC_ATTENUATION, 0.01);
	glLightfv(GL_LIGHT0, GL_AMBIENT,  ambient);

	glEnable(GL_LIGHTING);
	glEnable(GL_LIGHT0);

	/* Materials */
	glMaterialfv(GL_FRONT, GL_AMBIENT, ambient);
	glMaterialfv(GL_FRONT, GL_SPECULAR, specular);
	glMaterialfv(GL_FRONT, GL_SHININESS, shininess);

	glEnable(GL_DEPTH_TEST);
	glShadeModel(GL_SMOOTH);
	glEnable(GL_POLYGON_SMOOTH);

	/* Texture */
	read_ppm_file(&pit_image, "pit.ppm");
	glGenTextures(1, &pit_texture);
	glBindTexture(GL_TEXTURE_2D, pit_texture);
	glTexEnvi(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_NEAREST);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	gluBuild2DMipmaps(GL_TEXTURE_2D, 3, pit_image.Width, pit_image.Height, GL_RGB, GL_UNSIGNED_BYTE, pit_image.Pixel);

	read_ppm_file(&grass_image, "grass.ppm");
	glGenTextures(1, &grass_texture);
	glBindTexture(GL_TEXTURE_2D, grass_texture);
	glTexEnvi(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_NEAREST);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	gluBuild2DMipmaps(GL_TEXTURE_2D, 3, grass_image.Width, grass_image.Height, GL_RGB, GL_UNSIGNED_BYTE, grass_image.Pixel);
}

void ui_disp_splash()
{
	SDL_Surface* surface;
	SDL_Surface* image = NULL;
	SDL_Surface* optimized_image = NULL;


	// Load the image from file
	image = SDL_LoadBMP(SPLASH_FILE);
	if(image == NULL)
	{
		printf("Failed to load splash image: %s\n", SDL_GetError());
		exit(1);
	}

	SDL_putenv("SDL_VIDEO_CENTERED=1");

	// Get a surface of the same size as the image
	surface = SDL_SetVideoMode(image->w, image->h, 0, SDL_NOFRAME);
	if(surface == NULL)
	{
		printf("Failed to get video surface: %s\n", SDL_GetError());
		exit(1);
	}

	SDL_putenv("SDL_VIDEO_CENTERED=0");

	// Optimize the image for the surface
	optimized_image = SDL_DisplayFormat(image);
	if(optimized_image == NULL)
	{
		printf("Failed to optimize splash image: %s\n", SDL_GetError());
		exit(1);
	}

	// Free the original image 
	SDL_FreeSurface(image);

	// Put the image on the surface
	if(SDL_BlitSurface(optimized_image, NULL, surface, NULL))
	{
		printf("Failed to blit the splash image: %s\n", SDL_GetError());
		exit(1);
	}

	SDL_Flip(surface);

	SDL_Delay(1000 * 2);
}

void ui_disp_main()
{
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);	
	glNormal3f(0.0, 1.0, 0.0);
	
	ui_disp_camera();
	ui_disp_lighting();
	ui_disp_player();
	ui_disp_grid();
	
	SDL_GL_SwapBuffers();
}

void ui_disp_lighting()
{
	static float light_diffuse[] = {1.0, 1.0, 1.0, 1.0};
	static float light_specular[] = {0.2, 0.2, 0.2, 1.0};
	static float light_direction[] = {0.0, -1.0, 0.0, 1.0};
	float x;
	float y;
	float h;
	
	if(gbLights)
	{
		x = 0.0;
		y = 0.0;
		h = 7.0;
		glLightf(GL_LIGHT0, GL_SPOT_CUTOFF,   60.0);
	}
	else
	{
		x = Left(gPlayerCol, 1, 2);
		y = Top(gPlayerRow, 1, 2);
		h = 4.0;
		glLightf(GL_LIGHT0, GL_SPOT_CUTOFF,   35.0);
	}

	float light_position[] = {x, h, y, 1.0};

	glLightfv(GL_LIGHT0, GL_DIFFUSE,  light_diffuse);
	glLightfv(GL_LIGHT0, GL_SPECULAR, light_specular);
	glLightfv(GL_LIGHT0, GL_POSITION, light_position);
	glLightfv(GL_LIGHT0, GL_SPOT_DIRECTION, light_direction);
}

void ui_disp_camera()
{
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
	
	glTranslatef(0.0, 0.0, -25.0);   // Back off
	glRotatef(35.0, 1.0, 0.0, 0.0);  // Tilt foward
	//glTranslatef(0.0, 0.0, 0.0);     // Slide right
	//glRotatef(0.0, 0.0, 1.0, 0.0);   // Rotate right
}

void ui_disp_grid()
{
	static float clear_color[] = {1.0, 1.0, 1.0, 1.0};
	//static float grass_color[] = {0.45, 0.85, 0.40, 1.0};
	//static float pit_color[]  = {0.15, 0.15, 0.15, 1.0};
	static float finish_color[] = {1.0, 0.0, 0.0, 1.0};
	//static float path_color[] = {0.40, 0.15, 0.85, 1.0};
	

	float* color;
	unsigned r, c;
	
	glEnable(GL_TEXTURE_2D);
	for(r = 0; r < GRID_H; ++r)
	for(c = 0; c < GRID_W; ++c)
	{
		switch(gGrid[r][c])
		{
			case PIT:
				color = clear_color;
				glBindTexture(GL_TEXTURE_2D, pit_texture);
				break;
			case PATH:
				//color = path_color;
				//color = grass_color;
				color = clear_color;
				glBindTexture(GL_TEXTURE_2D, grass_texture);
				break;
			case FINISH:
				color = finish_color;
				glBindTexture(GL_TEXTURE_2D, grass_texture);
				break;
			default:
				//color = grass_color;
				color = clear_color;
				glBindTexture(GL_TEXTURE_2D, grass_texture);
				break;
		}

		glMaterialfv(GL_FRONT, GL_DIFFUSE, color);
		ui_disp_tile(r, c, 15, -0.01);
	}
	glDisable(GL_TEXTURE_2D);
}

void
ui_disp_player()
{
	static float PlayerColor[] = {1.0, 0.0, 0.0, 1.0};
	static float PlatformColor[] = {0.85, 0.85, 0.80, 1.0};

	glMaterialfv(GL_FRONT, GL_DIFFUSE, PlatformColor);

	// Platform
	ui_disp_tile(gPlayerRow, gPlayerCol, 1, 0.02);

	glMaterialfv(GL_FRONT, GL_DIFFUSE, PlayerColor);

	// Head
	glBegin(GL_LINE_LOOP);
	glVertex3f(Left(gPlayerCol, 1, 4), 2.0, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 1, 4), 1.5, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 3, 4), 1.5, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 3, 4), 2.0, Top(gPlayerRow, 2, 4));
	glEnd();

	// Body
	glBegin(GL_LINES);
	glVertex3f(Left(gPlayerCol, 2, 4), 1.5, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 2, 4), 0.8, Top(gPlayerRow, 2, 4));
	glEnd();

	// Legs
	glBegin(GL_LINE_STRIP);
	glVertex3f(Left(gPlayerCol, 0, 4), 0.1, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 1, 4), 0.1, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 2, 4), 0.8, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 3, 4), 0.1, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 4, 4), 0.1, Top(gPlayerRow, 2, 4));
	glEnd();

	// Arms
	glBegin(GL_LINE_STRIP);
	glVertex3f(Left(gPlayerCol, 1, 4), 0.8, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 1, 4), 1.2, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 2, 4), 1.4, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 3, 4), 1.2, Top(gPlayerRow, 2, 4));
	glVertex3f(Left(gPlayerCol, 4, 4), 1.6, Top(gPlayerRow, 2, 4));
	glEnd();
}

void
ui_disp_tile(unsigned row, unsigned col, unsigned div, float z)
{
	unsigned subrow;
	unsigned subcol;

	for(subrow = 0; subrow < div; ++subrow)
	{
		glBegin(GL_QUAD_STRIP);

		glTexCoord2f(TexLeft(0, div), TexTop(subrow, div));
		glVertex3f(Left(col, 0, div), z, Top(row, subrow, div));
		glTexCoord2f(TexLeft(0, div), TexBottom(subrow, div));
		glVertex3f(Left(col, 0, div), z, Bottom(row, subrow, div));

		for(subcol = 0; subcol < div; ++subcol)
		{
			glTexCoord2f(TexRight(subcol, div), TexTop(subrow, div));
			glVertex3f(Right(col, subcol, div), z, Top(row, subrow, div));
			glTexCoord2f(TexRight(subcol, div), TexBottom(subrow, div));
			glVertex3f(Right(col, subcol, div), z, Bottom(row, subrow, div));
		}

		glEnd();
	}
}

