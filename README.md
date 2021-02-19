args [
    --time
    Date format is xx.xx.xxxx(day, month, year) or xh or xxh | xxxh(x - count ,h - hour)
    maxHours - 999
    example: --time=21h or --time=01.04.2001,
    
    --title
    If you wanna write title with space use '', example: --title='hello world !',

    --status
    Status can only be (true or false)
]

flags [
    -add,
    -delete,
    -update
]

example of write RECORD ( -add --title=hello --status=false )

               