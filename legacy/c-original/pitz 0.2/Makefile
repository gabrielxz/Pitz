CC = gcc
flags = -Wall -O3 
objs = main.o ui.o ui_disp.o ui_input.o game.o globals.o
links = -lSDL -lglu32 -lopengl32

run.exe: $(objs)
	$(CC) $(objs) $(links) -o run.exe

main.o: ui.h main.c
	$(CC) $(flags) -c main.c -o main.o

ui.o: ui_disp.h ui_input.h globals.h ui.h ui.c
	$(CC) $(flags) -c ui.c -o ui.o

ui_disp.o: globals.h ui_disp.h ui_disp.c
	$(CC) $(flags) -c ui_disp.c -o ui_disp.o

ui_input.o: globals.h ui_input.h ui_input.c
	$(CC) $(flags) -c ui_input.c -o ui_input.o

game.o: globals.h game.h game.c
	$(CC) $(flags) -c game.c -o game.o

globals.o: globals.h globals.c
	$(CC) $(flags) -c globals.c -o globals.o
	
clean:
	rm -fv *.o run.exe
