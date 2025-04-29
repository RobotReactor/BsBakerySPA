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

ps 98913;
while [ $? -eq 0 ];
do
  sleep 1;
  ps 98913 > /dev/null;
done;

for child in $(list_child_processes 98922);
do
  echo killing $child;
  kill -s KILL $child;
done;
rm /Users/maxwellbourcier/Documents/Code Repos/BsBakerySPA/BsBakerySPA.Server/bin/Debug/net8.0/a36ebd943c1443ed94ddb8ab569af73b.sh;
