![](./img/markdown-preview-mark.svg)
# nwjs-markdown-preview

The only markdown preview you need.

- rendering in GitHub flavor markdown
- most authentic HTML preview in real DOM
- automatic re-render when input file is saved

# USAGE
`nw mdp.nw -i ./README.md [-w true]`
- -_i_ \</path/to/input.md\>
- \[-_w_ \<false|(default)true\>\] - attach file watcher at app startup

# UI
## Toolbar
# ![](./img/chain.png) | ![](./img/chain-broken.png)
Disable/Enable watching the content of the input file, auto-refreshing when it changes.
Enabled by default, which can be overriden with `-w false`.

-

# ![](./img/refresh.png) | ![](./img/refresh-spin.gif)
You can manually refresh the output by clicking this icon.
The icon is spinning, when a document is being rendered.

-

# ![](./img/times.png)
Closes the App.

## Smiley Support
Supports all smileys, available on GitHub.

:1st_place_medal: :a: :aries: :smirk:
