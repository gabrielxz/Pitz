#include <GL/gl.h>
#include <GL/glu.h>
#include <SDL/SDL.h>
#include "ui_disp.h"
#include "globals.h"

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
	drawContext = SDL_SetVideoMode(SCREEN_W, SCREEN_H, 0, SDL_OPENGL);

	/* size and shape of view vol */
	glViewport(0, 0, SCREEN_W, SCREEN_H);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	gluPerspective(45.0, (float)SCREEN_W/(float)SCREEN_H, 0.1, 100.0);

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
	
	SDL_GL_SwapBuffers();
}

void ui_disp_lighting()
{
	static float light_diffuse[] = {1.0, 1.0, 1.0, 1.0};
	static float light_specular[] = {0.3, 0.3, 0.3, 1.0};
	static float light_position[] = {0.0, 5.0, 0.0, 1.0};
	static float light_direction[] = {0.0, -1.0, 0.0, 1.0};

	glLightfv(GL_LIGHT0, GL_DIFFUSE,  light_diffuse);
	glLightfv(GL_LIGHT0, GL_SPECULAR, light_specular);
	glLightfv(GL_LIGHT0, GL_POSITION, light_position);
	glLightfv(GL_LIGHT0, GL_SPOT_DIRECTION, light_direction);
}

void ui_disp_camera()
{
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
	
	glTranslatef(0.0, 0.0, -20.0);
	glRotatef(20.0, 1.0, 0.0, 0.0);
	//glTranslatef(0.0, 0.0, 0.0);
	glRotatef(0.0, 0.0, 1.0, 0.0);
}

void ui_disp_grid()
{
	int r, c;

	static float light[] = {0.85, 0.85, 0.80, 1.0};
	static float dark[]  = {0.15, 0.15, 0.15, 1.0};

	glBegin(GL_QUADS);
	glNormal3f(0.0, 1.0, 0.0);
	
	for(r = 0; r < 10; ++r)
	for(c = 0; c < 10; ++c)
	{
		glMaterialfv(GL_FRONT, GL_DIFFUSE, (r+c) & 1 ? dark : light);
		glVertex3f(-5.0+c, -0.01, -4.0+r);
		glVertex3f(-4.0+c, -0.01, -4.0+r);
		glVertex3f(-4.0+c, -0.01, -5.0+r);
		glVertex3f(-5.0+c, -0.01, -5.0+r);
	}

	glEnd();
}
