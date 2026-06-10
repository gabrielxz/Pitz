#include <GL/gl.h>
#include <GL/glu.h>
#include <SDL/SDL.h>
#include "ui_disp.h"
#include "globals.h"
#include "stdio.h"

#define Left(c, sc, div)   ((float)c + ((float)sc / (float)div) - ((float)GRID_W / 2.0))
#define Right(c, sc, div)  (Left(c, (sc + 1), div))
#define Top(r, sr, div)    ((float)r + ((float)sr / (float)div) - ((float)GRID_H / 2.0))
#define Bottom(r, sr, div) (Top(r, (sr + 1), div))

void ui_disp_init()
{
	const SDL_VideoInfo* video;
	SDL_Surface* drawContext;

	static float ambient[] = {0.0, 0.0, 0.0, 1.0};	/* We don't like ambient light */
	static float mat_specular[] = {1.0, 1.0, 1.0, 1.0};
	static float mat_shininess[] = {2.0};

	video = SDL_GetVideoInfo( );
	if(video == NULL) 
	{
		printf("Failed to get video information: %s\n", SDL_GetError());
		exit(1);
	}

	/* SDL display init */
	SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
	SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 16);
	SDL_GL_SetAttribute(SDL_GL_RED_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_GREEN_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_BLUE_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_ALPHA_SIZE, 8);

	drawContext = SDL_SetVideoMode(gScreenW, gScreenH, video->vfmt->BitsPerPixel, SDL_OPENGL);
	if(drawContext == NULL)
	{
		printf("Failed to get video surface: %s\n", SDL_GetError());
		exit(1);
	}

	/* size and shape of view vol */
	glViewport(0, 0, gScreenW, gScreenH);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	gluPerspective(45.0, (float)gScreenW/(float)gScreenH, 0.1, 100.0);

	/* Lighting */
	glLightModelfv(GL_LIGHT_MODEL_AMBIENT, ambient);
	glLightf(GL_LIGHT0, GL_SPOT_EXPONENT, 1.0);
	//glLightf(GL_LIGHT0, GL_SPOT_CUTOFF,   50.0);
	glLightf(GL_LIGHT0, GL_CONSTANT_ATTENUATION,  0.5);
	glLightf(GL_LIGHT0, GL_LINEAR_ATTENUATION,    0.1);
	glLightf(GL_LIGHT0, GL_QUADRATIC_ATTENUATION, 0.01);
	glLightfv(GL_LIGHT0, GL_AMBIENT,  ambient);
	glEnable(GL_LIGHTING);
	glEnable(GL_LIGHT0);

	/* Materials */
	glMaterialfv(GL_FRONT, GL_AMBIENT, ambient);
	glMaterialfv(GL_FRONT, GL_SPECULAR, mat_specular);
	glMaterialfv(GL_FRONT, GL_SHININESS, mat_shininess);

	/*  */
	//glEnable(GL_BLEND);
	//glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
	glEnable(GL_DEPTH_TEST);
	glShadeModel(GL_SMOOTH);
	glEnable(GL_POLYGON_SMOOTH);
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
		x = Left(gAaronCol, 1, 2);
		y = Top(gAaronRow, 1, 2);
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
	static float grass[] = {0.45, 0.85, 0.40, 1.0};
	static float pit[]  = {0.15, 0.15, 0.15, 1.0};
	static float finish[] = {0.85, 0.45, 0.40, 1.0};
	static float path[] = {0.40, 0.15, 0.85, 1.0};
	float* color;
	unsigned r, c;
	
	for(r = 0; r < GRID_H; ++r)
	for(c = 0; c < GRID_W; ++c)
	{
		switch(gGrid[r][c])
		{
			case PIT:
				color = pit;
				break;
			case PATH:
				//color = path;
				color = grass;
				break;
			case FINISH:
				color = finish;
				break;
			default:
				color = grass;
				break;
		}

		glMaterialfv(GL_FRONT, GL_DIFFUSE, color);
		ui_disp_tile(r, c, 15, -0.01);
	}
}

void
ui_disp_player()
{
	static float AaronColor[] = {0.85, 0.85, 0.80, 1.0};

	glMaterialfv(GL_FRONT, GL_DIFFUSE, AaronColor);

	ui_disp_tile(gAaronRow, gAaronCol, 1, 0.02);
}

void
ui_disp_tile(unsigned row, unsigned col, unsigned div, float z)
{
	unsigned subrow;
	unsigned subcol;

	for(subrow = 0; subrow < div; ++subrow)
	{
		glBegin(GL_QUAD_STRIP);

		glVertex3f(Left(col, 0, div), z, Top(row, subrow, div));
		glVertex3f(Left(col, 0, div), z, Bottom(row, subrow, div));

		for(subcol = 0; subcol < div; ++subcol)
		{
			glVertex3f(Right(col, subcol, div), z, Top(row, subrow, div));
			glVertex3f(Right(col, subcol, div), z, Bottom(row, subrow, div));
		}

		glEnd();
	}
}

