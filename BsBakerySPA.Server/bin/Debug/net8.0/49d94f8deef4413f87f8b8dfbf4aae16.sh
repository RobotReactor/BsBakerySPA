function list_child_processes () {
    local ppid=$1;
    local current_children=$(pgrep -P $ppid);
    local local_child;
    if [ $? -eq 0 ];
    then
        for current_child in $current_children
        do
          local_child=$current_child;
          list_child_processes $local_child;
          echo $local_child;
        done;
    else
      return 0;
    fi;
}

ps 99588;
while [ $? -eq 0 ];
do
  sleep 1;
  ps 99588 > /dev/null;
done;

for child in $(list_child_processes 99591);
do
  echo killing $child;
  kill -s KILL $child;
done;
rm /Users/maxwellbourcier/Documents/Code Repos/BsBakerySPA/BsBakerySPA.Server/bin/Debug/net8.0/49d94f8deef4413f87f8b8dfbf4aae16.sh;
