#ifndef _CMIM_TYPES_
#define _CMIM_TYPES_

#include <stdlib.h>

typedef struct
{
	NUM      Height;         // height
	NUM      Width;          // width
	
	unsigned char** Pixel;        // integer data
} IMAGE, *PIMAGE;

#endif
