#include <stdlib.h>
#include "ui_input.h"
#include "globals.h"

// This file handles SDL events. No other file should need to know about the event types or structures.

void
ui_input_init()
{
}

void
ui_input_main()
{
	SDL_Event event;

	while ( SDL_PollEvent(&event) )
	{
		switch (event.type)
		{
			case SDL_MOUSEMOTION:
				ui_input_mousemove(event.motion.x, event.motion.y);
				break;
			case SDL_MOUSEBUTTONDOWN:
				ui_input_buttondown(event.button.button, event.button.x, event.button.y);
				break;
			case SDL_MOUSEBUTTONUP:
				ui_input_buttonup(event.button.button, event.button.x, event.button.y);
				break;
			case SDL_KEYDOWN:
				ui_input_keydown(event.key.keysym);
				break;
			case SDL_KEYUP:
				ui_input_keyup(event.key.keysym);
				break;
			case SDL_QUIT:
				SDL_Quit();
				exit(0);
			default:
				break;
		}
	}
}

void
ui_input_mousemove(Uint16 x, Uint16 y)
{
}

void
ui_input_buttondown(Uint8 button, Uint16 x, Uint16 y)
{
}

void
ui_input_buttonup(Uint8 button, Uint16 x, Uint16 y)
{
}

void
ui_input_keydown(SDL_keysym key)
{
}

void
ui_input_keyup(SDL_keysym key)
{
}
