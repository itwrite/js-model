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
M(response.list)
.debug(true)
.join("STAT_MO",response.list1,'l.STAT_MO')
.fields(["*",'ITEM_CD as id','FREE_DIM_NAM1 as 名称1','CMCC_BRANCH_CD'])
.where({"CMCC_BRANCH_CD":"GD"})
.where_between('l.FREE_DIM_NAM1',[100,23232])
.where_like('ITEM_CD','G')
.where_in("l.FREE_DIM_NAM1",['201608','29304'])
.where_not_in("l.FREE_DIM_NAM1",['201609','29304'],'or')
.order_by({"ITEM_CD":'desc',"STAT_MO":1})
.limit(0,10)
.fetch(function (i,row) {
        console.log(row['ITEM_CD']);
});//Here if you give it a callback Function, then it will be call when foreach very item of result;
```
