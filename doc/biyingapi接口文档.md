<https://api.biyingapi.com/hslt/new/biyinglicence> 接口说明：新股日历，按申购日期倒序。

字段名称   | 数据类型   | 字段说明
------ | ------ | -------------------
zqdm   | string | 股票代码
zqjc   | string | 股票简称
sgdm   | string | 申购代码
fxsl   | number | 发行总数（股）
swfxsl | number | 网上发行（股）
sgsx   | number | 申购上限（股）
dgsz   | number | 顶格申购需配市值(元)
sgrq   | string | 申购日期
fxjg   | number | 发行价格（元），null为"未知"
zxj    | number | 最新价（元），null为"未知"
srspj  | number | 首日收盘价（元），null为"未知"
zqgbrq | string | 中签号公布日，null为未知
zqjkrq | string | 中签缴款日，null为未知
ssrq   | string | 上市日期，null为未知
syl    | number | 发行市盈率，null为"未知"
hysyl  | number | 行业市盈率
wszql  | number | 中签率（%），null为"未知"
yzbsl  | number | 连续一字板数量，null为"未知"
zf     | number | 涨幅（%），null为"未知"
yqhl   | number | 每中一签获利（元），null为"未知"
zyyw   | string | 主营业务
