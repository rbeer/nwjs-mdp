![](./img/markdown-preview-mark.svg)
# nwjs-markdown-preview

### Download
[Just GitHub, for now](https://github.com/rbeer/nwjs-mdp.git)

### Renders GitHub Flavored Markdown

```js
const examples = {
  active: [ 'codeblocks', 'Strikethrough', 'Tables' ],
  syntaxHighlighting: true
};
```

ToDo | Done
---- | ----
~~write README.md~~ | X
have me some pizza |

### Displays images for GFM `:smiley:` tags
:1st_place_medal: :a: :aries: :smirk:

# USAGE
`nw mdp.nw -i ./README.md [-w true]`
- -_i_ \</path/to/input.md\>
- \[-_w_ \<false|(default)true\>\] - attach file watcher at app startup

# Toolbar
# ![](./img/refresh.png) | ![](./img/refresh-spin.gif)
You can manually refresh the output by clicking this icon.
The icon is spinning, when a document is being rendered.

-

# ![](./img/hashtag.png)
Shows the ouput HTML source.

-

# ![](./img/chain.png) | ![](./img/chain-broken.png)
Disable/Enable watching the content of the input file, auto-refreshing when it changes.
Enabled by default, which can be overriden with `-w false`.

-

# ![](./img/times.png)
Closes the App.

