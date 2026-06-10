#include "ui.h"
#include "globals.h"

int main(int argc, char** argv)
{
	globals_init();
	ui_init();
	
	for(;;)
	{
		ui_main();
	}
	
	return 0;
}
