#ifndef _CLM_UIDISP_
#define _CLM_UIDISP_

void
ui_disp_init();

void
ui_disp_splash();

void
ui_disp_main();

void
ui_disp_camera();

void
ui_disp_lighting();

void
ui_disp_grid();

void
ui_disp_player();

void
//ui_disp_tile(unsigned row, unsigned col, unsigned div_row, unsigned div_col, float z);
//ui_disp_tile(unsigned row, unsigned col, unsigned div_row, unsigned div_col, float z, float* color);
ui_disp_tile(unsigned row, unsigned col, unsigned div, float z);

#endif
