#include "ui.h"
#include "ui_disp.h"
#include "ui_input.h"

void ui_init()
{
	SDL_Init(SDL_INIT_VIDEO);

	ui_disp_init();
	ui_input_init();
}

void ui_main()
{
	ui_disp_main();
	ui_input_main();
}
