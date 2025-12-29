@echo off

gcc server.c ^
    E:\sqlilte\sqlite-amalgamation-3510100\sqlite3.c ^
    -IE:\sqlilte\sqlite-amalgamation-3510100\ ^
    -lws2_32 ^
    -o server.exe
