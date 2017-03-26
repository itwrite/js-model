[Model](https://github.com/itwrite/js-model/) — New Wave JavaScript
==================================================

Contribution Guides
--------------------------------------

In the spirit of open source software development, Model always encourages community code contribution. To help you get started.


Environments in which to use Model
--------------------------------------

- [source](https://github.com/itwrite/js-model/blob/master/model-1.0.1.js)


What you need to build your own Model
--------------------------------------

In order to build Model, you need to have the latest Node.js/npm and git 1.7 or later. Earlier versions might work, but are not supported.

For Windows, you have to download and install [git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download/).

OS X users should install [Homebrew](http://brew.sh/). Once Homebrew is installed, run `brew install git` to install git,
and `brew install node` to install Node.js.

Linux/BSD users should use their appropriate package managers to install git and Node.js, or build from source
if you swing that way. Easy-peasy.


How to build your own Model
----------------------------

Clone a copy of the main Model git repo by running:

```bash
git clone git://github.com/itwrite/js-model.git
```
How use Model
----------------------------

Examples:

```bash
M(response.list)
.join("STAT_MO",response.list1,'l.STAT_MO','left')
.fields(['*','ITEM_CD','FREE_DIM_NAM1','CMCC_BRANCH_CD'])//['*','t.STAT_MO as 月份','l.CMCC_BRANCH_CD as id'])
.where({"CMCC_BRANCH_CD":'201608'})
.where_between('FREE_DIM_NAM1',[100,23232])
.where_like('ITEM_CD','07411')
.where_in("l.FREE_DIM_NAM1",['201608','29304'])
.where_not_in("l.FREE_DIM_NAM1",['201609','29304'],'or')
.order_by({"FREE_DIM_NAM1":'desc'})
.limit(0,10)
//.toSql(true) //if true,then return M and console.log(sql);others return `sql`,just use to make sure your logic is right
.fetch(function (i,row) {
     console.log(row['ITEM_CD']);
});//Here you can give it a callback Function, then it will be call when foreach very item of result;
```
