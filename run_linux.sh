function print_help {
  echo ".mdP - 0.0.9"
  echo "Github flavored markdown live preview."
  echo -e "Depends: 'nwjs and packages, see package.json'\n"
  if [ "$2" == "?" ]; then
    echo -e "\e[31m--- Invalid option: -$1 ---\e[0m\n"
  fi
  if [ "$2" == ":" ]; then
    echo -e "\e[31m--- -$1 requires an argument ---\e[0m\n"
  fi
  echo "Usage: ./mdp.sh -f <filename.md> [-w <true>]"
  echo "  -f filename  | Path to .md file to preview. Default: ./README.md"
  echo -e "  -w           | Whether to auto-attach the file-watcher. Default: true \n"
  exit 1
}

APP_DIR=/var/wwn/nwjs-mdp
INPUTPATH=$APP_DIR/README.md
FILEWATCHER="true"
DEBUG="false"

[ -r $1 ] && INPUTPATH=$1

while getopts ":w:hdf:" opt; do
  case $opt in
    \?)
      print_help $OPTARG $opt
      ;;
    :)
      print_help $OPTARG $opt
      ;;
    d)
      DEBUG="true"
      ;;
    f)
      INPUTPATH=$OPTARG
      ;;
    h)
      print_help
      ;;
    w)
      FILEWATCHER=$OPTARG
      ;;
  esac
done

nw $APP_DIR -f $INPUTPATH -w $FILEWATCHER -d $DEBUG
