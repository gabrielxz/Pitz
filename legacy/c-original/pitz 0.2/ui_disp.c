#include <GL/gl.h>
#include <GL/glu.h>
#include <SDL/SDL.h>
#include "ui_disp.h"
#include "globals.h"
#include "stdio.h"

#define Left   (0.0 - (GRID_W / 2.0))
#define Right  (1.0 - (GRID_W / 2.0))
#define Top    (0.0 - (GRID_H / 2.0))
#define Bottom (1.0 - (GRID_H / 2.0))

void ui_disp_init()
{
	SDL_Surface* drawContext;
	static float ambient[] = {0.0, 0.0, 0.0, 1.0};	/* We don't like ambient light */
	static float mat_specular[] = {1.0, 1.0, 1.0, 1.0};
	static float mat_shininess[] = {2.0};

	/* SDL display init */
	SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
	SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 16);
	SDL_GL_SetAttribute(SDL_GL_RED_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_GREEN_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_BLUE_SIZE, 8);
	SDL_GL_SetAttribute(SDL_GL_ALPHA_SIZE, 8);
	drawContext = SDL_SetVideoMode(gScreenW, gScreenH, 0, SDL_OPENGL);

	/* size and shape of view vol */
	glViewport(0, 0, gScreenW, gScreenH);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	gluPerspective(45.0, (float)gScreenW/(float)gScreenH, 0.1, 100.0);

	/* Lighting */
	glLightModelfv(GL_LIGHT_MODEL_AMBIENT, ambient);
	glLightf(GL_LIGHT0, GL_SPOT_EXPONENT, 1.0);
	glLightf(GL_LIGHT0, GL_SPOT_CUTOFF,   50.0);
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

	/* Depth testing */
	glEnable(GL_DEPTH_TEST);
}

void ui_disp_main()
{
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);	
	
	ui_disp_camera();
	ui_disp_lighting();
	ui_disp_grid();
	ui_disp_player();
	
	SDL_GL_SwapBuffers();
}

void ui_disp_lighting()
{
	static float light_diffuse[] = {1.0, 1.0, 1.0, 1.0};
	static float light_specular[] = {0.3, 0.3, 0.3, 1.0};
	static float light_direction[] = {0.0, -1.0, 0.0, 1.0};
	float x = 0.0;
	float y = 0.0;
	x = Left + gAaronCol + 0.5;
	y = Top  + gAaronRow + 0.5;
	float light_position[] = {x, 5.0, y, 1.0};

	glLightfv(GL_LIGHT0, GL_DIFFUSE,  light_diffuse);
	glLightfv(GL_LIGHT0, GL_SPECULAR, light_specular);
	glLightfv(GL_LIGHT0, GL_POSITION, light_position);
	glLightfv(GL_LIGHT0, GL_SPOT_DIRECTION, light_direction);
}

void ui_disp_camera()
{
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
	
	glTranslatef(0.0, 0.0, -20.0);   // Back off
	glRotatef(25.0, 1.0, 0.0, 0.0);  // Tilt foward
	//glTranslatef(0.0, 0.0, 0.0);     // Slide right
	//glRotatef(0.0, 0.0, 1.0, 0.0);   // Rotate right
}

void ui_disp_grid()
{
	static float grass[] = {0.45, 0.85, 0.40, 1.0};
	static float pit[]  = {0.15, 0.15, 0.15, 1.0};
	static float finish[] = {0.85, 0.45, 0.40, 1.0};
	float* color;
	unsigned r, c;

	glBegin(GL_QUADS);
	glNormal3f(0.0, 1.0, 0.0);
	
	for(r = 0; r < 10; ++r)
	for(c = 0; c < 10; ++c)
	{
		switch(gGrid[r][c])
		{
			case PIT:
				color = pit;
				break;
			case FINISH:
				color = finish;
				break;
			default:
				color = grass;
				break;
		}

		glMaterialfv(GL_FRONT, GL_DIFFUSE, color);

		glVertex3f(Left  + c, -0.01, Bottom + r);
		glVertex3f(Right + c, -0.01, Bottom + r);
		glVertex3f(Right + c, -0.01, Top    + r);
		glVertex3f(Left  + c, -0.01, Top    + r);
	}

	glEnd();
}

void
ui_disp_player()
{
	static float AaronColor[] = {0.85, 0.85, 0.80, 1.0};

	glBegin(GL_QUADS);
	glNormal3f(0.0, 1.0, 0.0);

	glMaterialfv(GL_FRONT, GL_DIFFUSE, AaronColor);
	glVertex3f(Left  + gAaronCol, 0.02, Bottom + gAaronRow);
	glVertex3f(Right + gAaronCol, 0.02, Bottom + gAaronRow);
	glVertex3f(Right + gAaronCol, 0.02, Top    + gAaronRow);
	glVertex3f(Left  + gAaronCol, 0.02, Top    + gAaronRow);

	glEnd();
}
