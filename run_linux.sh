function print_help {
  echo ".mdP - 0.0.9"
  echo "Github flavored markdown live preview."
  echo -e "Depends: 'nwjs and packages, see package.json'\n"
  if [ -n "$1" ]; then
    echo -e "\e[31m--- Invalid option: -$1 ---\e[0m\n"
  fi
  echo "Usage: ./mdp.sh -f <filename.md> [-w <true>]"
  echo "  -f filename  | Path to .md file to preview. Default: ./README.md"
  echo -e "  -w           | Whether to auto-attach the file-watcher. Default: true \n"
  exit 1
}

APP_DIR=/var/wwn/nwjs-mdp
INPUTPATH=$APP_DIR/README.md
FILEWATCHER=true

[ -r $1 ] && INPUTPATH=$1

while getopts ":w:hf:" opt; do
  case $opt in
    \?)
      print_help $OPTARG
      ;;
    :)
      print_help $OPTARG
      ;;
    h)
      print_help
      ;;
    f)
      INPUTPATH=$OPTARG
      ;;
    w)
      FILEWATCHER=$OPTARG
      ;;
  esac
done

nw $APP_DIR -f $INPUTPATH -w $FILEWATCHER
