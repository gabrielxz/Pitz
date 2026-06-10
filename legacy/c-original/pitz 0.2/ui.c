#include "globals.h"
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
	if(gbRedraw)
	{
		ui_disp_main();
		gbRedraw = FALSE;
	}

	ui_input_main();
}
