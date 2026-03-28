# VHS tape file for pazzwrd demo
# https://github.com/charmbracelet/vhs

Output assets/demo.gif

Set Shell "bash"
Set FontSize 20
Set Width 800
Set Height 280
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 80ms
Set CursorBlink false

Hide
Type "export PS1='$ ' PATH=$HOME/.bun/bin:$PATH"
Enter
Sleep 500ms
Type "clear"
Enter
Sleep 300ms
Show

Type "pazzwrd"
Sleep 300ms
Enter
Sleep 2s

Type "pazzwrd"
Sleep 300ms
Enter
Sleep 2s

Type "pazzwrd"
Sleep 300ms
Enter
Sleep 2500ms
