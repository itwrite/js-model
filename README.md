[Model](https://github.com/itwrite/model/) — 1.0.2
==================================================

Contribution Guides
--------------------------------------

In the spirit of open source software development, Model always encourages community code contribution. To help you get started.


Environments in which to use Model
--------------------------------------

- [source](https://github.com/itwrite/js-model/blob/master/model-last.js)


How to build your own Model
----------------------------

Clone a copy of the main Model git repo by running:

```bash
git clone git://github.com/itwrite/model.git
```
How use Model
----------------------------

Examples:

```bash

var categories = [{ id: 2, name: "cat1" }, { id: 4, name: "cat2" }];
var goods = [{ id: 1, cid: 2, name: "goods1" }, { id: 2, cid: 4, name: "goods2" }];
var attrs = [{ id: 1, gid: 1, name: "goods1_attr" }, { id: 2, gid: 2, name: "goods2_attr" }];

Example 1:
Model(goods)
.debug(true)
.join("cid", categories, 'c.id')
.join("id", attrs, 'a.gid')
//.fields('*')
.fields(['c.id as cid2', 'c.name as 分类名称','a.name as 属性名称'])
//.where({"id":"2"})
.where_between('c.id', [1, 100])
.where_like('a.name', 'goods')
.where_in("c.id", [2, 4])
.order_by({ "id": 'desc', "cid": 1 })
.limit(0, 10)
.fetch(function (i, row) {
//The fetch funciton, if you give it a callback Function as paramter, then it will be call when foreach very item of result;
console.log('each row:',row);
});

Example 2:
Model(goods).where({id:1}).update({name:"商品1"});
console.log(goods);

Example 3:
Model(categories).where({id:4}).remove();
console.log(goods);


```
