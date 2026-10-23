# 冒冒手写字库

当前网页使用开源 **LXGW WenKai Medium** 的 UI 字形子集预览稍厚的手写排版。字体文件与授权见本目录的 `LXGWWenKai-ui-medium-subset.ttf` 和 `OFL.txt`，普通字重子集也保留在 `LXGWWenKai-ui-subset.ttf`。来源：[LXGW WenKai](https://github.com/lxgw/LxgwWenKai)。用户自行发布的动态如包含子集以外的字，会回退到系统中文字体。

`glyphs.tsv` 是当前页面文案用到的起始字表。以后用 Procreate 绘制专属「Maomao Hand」时，每个字请导出透明 PNG，文件名使用字表里的 Unicode 编号，例如 `U+5192.png`。建议使用统一的 1024×1024 画布、同一基线和相近的笔画粗细；保留真实笔触，不要拉伸单字来凑宽度。

完成一批字形后，可以将它们合成字体文件放在这里，再把 `font-preview.css` 的第一字体来源改为新的 `Maomao Hand`。字表只是起点，正式支持用户输入的任意中文还需要持续补字。
