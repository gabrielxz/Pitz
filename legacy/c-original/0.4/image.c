#include "image.h"

void image_alloc(PIMAGE im)
{
	NUM i;

	im->Pixels = (PPIXEL*)malloc(im->Height * sizeof(PPIXEL));
	im->Ipixels = (PIPIXEL*)malloc(im->Height * sizeof(PIPIXEL));
	if(im->Pixels == NULL || im->Ipixels == NULL)
	{
		image_dealloc(im);
		exit(1);
	}

	for(i = 0; i < im->Height; ++i)
	{
		im->Pixels[i] = (PPIXEL)malloc(im->Width * sizeof(PIXEL));
		im->Ipixels[i] = (PIPIXEL)malloc(im->Width * sizeof(IPIXEL));
		if(im->Pixels[i] == NULL || im->Ipixels[i] == NULL)
		{
			image_dealloc(im);
			exit(1);
		}
	}
}

void image_dealloc(PIMAGE im)
{
	NUM i;
	for(i = 0; i < im->Height; ++i)
	{
		if(im->Pixels[i] != NULL)
		{
			free(im->Pixels[i]);
		}
		if(im->Ipixels[i] != NULL)
		{
			free(im->Ipixels[i]);
		}
	}
	if(im->Pixels != NULL)
	{
		free(im->Pixels);
	}
	if(im->Ipixels != NULL)
	{
		free(im->Ipixels);
	}
}
