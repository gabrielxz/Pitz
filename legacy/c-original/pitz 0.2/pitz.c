// Define the states of a cell
typedef enum
{
	FLAT,
	START,
	FINISH,
	PIT
} Cell;

// Define the directions include invalid
// to be used for bad user input
typedef enum
{
	NORTH,
	SOUTH,
	EAST,
	WEST,
	INVALID
} Direction;

// Foward declare our functions
void init_grid();
void disp_grid();
void manuever();
Direction user_input();
bool game_over();

// The grid
Cell gGrid[10][10];

// Aaron's location on the grid
unsigned gAaronRow;
unsigned gAaronCol;

// Main function - execution begins here
int main()
{
	// initialize
	srand(32);
	gAaronRow = 0;
	gAaronCol = 0;
	init_grid();

	// play
	while(!game_over())
	{
		disp_grid();
		manuever();
	}

	return 0;
}

void init_grid()
{
	unsigned row, col;
	unsigned PitCount;
	unsigned PitRow, PitCol;
	unsigned r;

	// Set everything flat
	for(row = 0; row < 10; row++)
	{
		for(col = 0; col < 10; col++)
		{
			gGrid[row][col] = FLAT;
		}
	}

	// Set start and finish markers
	gGrid[0][0] = START;
	gGrid[9][9] = FINISH;

	// Place pits
	PitCount = 0;
	while(PitCount < 20)
	{
		r = rand() / (RAND_MAX / 100);
		
		PitRow = r / 10;
		PitCol = r % 10;

		if(gGrid[PitRow][PitCol] == FLAT)
		{
			gGrid[PitRow][PitCol] = PIT;
			PitCount++;
		}
	}
}

void disp_grid()
{
	unsigned row, col;
	char loc;

	printf("+ ");
	for(col = 0; col < 10; col++)
	{
		printf("- ");
	}
	printf("+\n");

	for(row = 0; row < 10; row++)
	{
		printf("| ");
		for(col = 0; col < 10; col++)
		{
			switch(gGrid[row][col])
			{
				case FLAT:
					loc = ' ';
					break;
				case START:
					loc = 'S';
					break;
				case FINISH:
					loc = 'F';
					break;
				case PIT:
					loc = '@';
					break;
				default:
					exit(1);
			}

			if(row == gAaronRow && col == gAaronCol)
			{
				loc = 'A';
			}

			printf("%c ", loc);
		}
		printf("|\n");
	}

	printf("+ ");
	for(col = 0; col < 10; col++)
	{
		printf("- ");
	}
	printf("+\n");
}

void manuever()
{
	Direction d;
	bool successful;

	successful = FALSE;

	// Get a direction from the user
	d = user_input();

	// Apply that direction to Aaron's location
	// unless it moves him out of the grid
	switch(d)
	{
		case NORTH:
			if(gAaronRow > 0)
			{
				successful = TRUE;
				--gAaronRow;
			}
			break;
		case SOUTH:
			if(gAaronRow < 9)
			{
				successful = TRUE;
				++gAaronRow;
			}
			break;
		case WEST:
			if(gAaronCol > 0)
			{
				successful = TRUE;
				--gAaronCol;
			}
			break;
		case EAST:
			if(gAaronCol < 9)
			{
				successful = TRUE;
				++gAaronCol;
			}
			break;
		default:
			exit(1);
	}

	// If it would have moved him out of the grid, 
	// insult the user
	if(!successful)
	{
		printf("You bumped into a wall, jerky!\n");
	}
}

Direction user_input()
{
	char input;
	Direction d;

	d = INVALID;
	while(d == INVALID)
	{
		scanf("%c", &input);

		switch(input)
		{
			case 'W':
			case 'w':
				d = NORTH;
				break;
			case 'A':
			case 'a':
				d = WEST;
				break;
			case 'S':
			case 's':
				d = SOUTH;
				break;
			case 'D':
			case 'd':
				d = EAST;
				break;
			case 'X':printf("3.14159 26535 89793 23846 26433 83279 50288 41971 69399 37510 \nThe universe explodes!\n");
				exit(1);	
		}
	}
	
	return d;
}

bool game_over()

{
 	bool q;
 	q=FALSE;
 	
	if(gGrid[gAaronRow][gAaronCol]==PIT)
	{
		  printf("Ahhhhhhhhhhhhh! I'm dead now!\n");
		  q=TRUE;
	}
        
        else if(gGrid[gAaronRow][gAaronCol]==FINISH)
 	{
 		 printf("You're the master of the universe!\n");
 		 q=TRUE;
 	}
 
 return q;

}
