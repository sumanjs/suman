#include <stdio.h>

int main (int argc, char **argv)
{
    FILE * pFile = fopen (argv[1],"a");
    if (!pFile) {
        fprintf(stderr, "Couldn't open file\n");
        return -1;
    }
    fprintf(pFile, "%c", 0);

    fclose (pFile);
    return 0;
}
