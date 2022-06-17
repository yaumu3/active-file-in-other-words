# Active file in other words

This extension will show the active file's alias to the status bar. You can also refer to its description by selecting the item.

![demo](https://raw.githubusercontent.com/yaumu3/active-file-in-other-words/main/media/demo.gif)

## Extension Settings

This extension contributes the following settings:

- `active-file-in-other-words.maps`: Maps between file's base name and alias/description.

For example, following setting was used in the demo.

```json
"active-file-in-other-words.maps": [
    {
        "baseName": "Untitled-1",
        "alias": "Alias-1",
        "description": "This is a description<br>which is shown in side view.<ol><li>You</li><li>can</li><li>pass</li><li>html</li></ol>"
    },
    {
        "baseName": "Untitled-2",
        "alias": "Yay!",
        "description": "Sounds good."
    }
]
```
