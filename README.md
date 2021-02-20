
If you make a timestamp, then after the time it is removed !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
example -add --path=../dater.json --time=0h   -  This entry will be removed immediately

args [
    --time
    Date format is xx.xx.xxxx(day, month, year) or xh or xxh | xxxh(x - count ,h - hour)
    maxHours - 999
    example: --time=21h or --time=01.04.2001
    --time=12h  =  timeNow + 12hours
    --time=-5h  =  timeNow - 5hours,
    
    --title
    If you wanna write title with space use '', example: --title='hello world !',

    --status
    Status can only be (true or false)
    example: --status=false,

    --path
    example --path=../../../hello.xml, --path=../dater.json
]

flags [
    -add,
    -delete,
    -update,
    -deleteAll,
    -show,
    -showExpiring
]

ADD record;
example of write RECORD ( -add --path=../hello.json )

DELETE the record by --id;
example: -delete --path=../dater.json --id=2 

UPDATE the record by --id;
example: -update --path=../dater.json --id=5 --title=1;

DELETE_ALL;
example: -deleteAll --path=../dater.json 

SHOW;
example: -show --path=../dater.json

SHOW_EXPIRING
example: -showExpiring --path=../dater.json
With this flag, you will see how much time is left before deleting the marked record




               