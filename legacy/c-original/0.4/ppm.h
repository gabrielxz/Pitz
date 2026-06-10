#ifndef _CLM_PPM_
#define _CLM_PPM_

#include <GL/gl.h>

typedef struct
{
	unsigned    Height;
	unsigned    Width;
	GLubyte*    Pixel;
} IMAGE, *PIMAGE;

void read_ppm_file(PIMAGE im, char* filename);
void image_alloc(PIMAGE im);

#endif
