#ifndef _CLM_UIINPUT_
#define _CLM_UIINPUT_

#include <SDL/SDL.h>

void 
ui_input_init();

void 
ui_input_main();

void
ui_input_mousemove(Uint16 x, Uint16 y);

void
ui_input_buttondown(Uint8 button, Uint16 x, Uint16 y);

void
ui_input_buttonup(Uint8 button, Uint16 x, Uint16 y);

void
ui_input_keydown(SDL_keysym key);

void
ui_input_keyup(SDL_keysym key);

#endif
