#include <stdio.h>
#include <stdlib.h>
#include "ppm.h"

void skip_comments(FILE* file);

void read_ppm_file(PIMAGE im, char* filename)
{
	FILE*       file;
	char        type;

	file = fopen(filename, "rb");
	if(file == NULL)
	{
		exit(1);
	}

	// read type
	fscanf(file, "%*c");
	fscanf(file, "%c", &type);
	if(type != '6')
	{
		printf("Failed to read PPM image: Unsupported format\n");
		exit(1);
	}

	skip_comments(file);

	// read dimensions
	fscanf(file, "%u", &im->Width);
	fscanf(file, "%u", &im->Height);

	skip_comments(file);

	// read max color
	fscanf(file, "%*u");

	// Remove any extra chars after max color
	fscanf(file, "%*c");

	// Allocate memory
	image_alloc(im);

	// Read Binary Pixels 1 row at a time
	fread(im->Pixel, 3, im->Width * im->Height, file);

	fclose(file);
}

void skip_comments(FILE* file)
{
	char ch;
	fgetc(file);
	while(ch = fgetc(file), ch == '#')
	{
		while(ch = fgetc(file), ch != '\n');
	}
	ungetc(ch,file);
}

void image_alloc(PIMAGE im)
{
	im->Pixel = (GLubyte*)malloc(im->Height * im->Width * 3 * sizeof(GLubyte));
	if(im->Pixel == NULL)
	{
		printf("Failed to allocate memory for image\n");
		exit(1);
	}

/*
	unsigned i;

	im->Pixel = (COLOR**)malloc(im->Height * sizeof(COLOR*));
	if(im->Pixel == NULL)
	{
		printf("Failed to allocate memory for image\n");
		exit(1);
	}

	for(i = 0; i < im->Height; ++i)
	{
		im->Pixel[i] = (COLOR*)malloc(im->Width * sizeof(COLOR));
		if(im->Pixel[i] == NULL)
		{
			printf("Failed to allocate memory for image\n");
			exit(1);
		}
	}
*/
}
