/**
 * Created by zzpzero on 2017/03/26.
 */

(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        // For CommonJS and CommonJS-like environments where a proper `window`
        // is present, execute the factory and get Model.
        // For environments that do not have a `window` with a `document`
        // (such as Node.js), expose a factory as module.exports.
        // This accentuates the need for the creation of a real `window`.
        // e.g. var Model = require("model")(window);
        module.exports = global.document ?
            factory(global, true) :
            function (w) {
                if (!w.document) {
                    throw new Error("Model requires a window with a document");
                }
                return factory(w);
            };
    } else {
        factory(global);
    }
}(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
    var _debug = true,
        __time = null,
        __data = [],
        __table_alias_names = {},
        __operators = ['==', '===', '<', '>', '<=', '>=', '<>', '!=', '<<', '>>', 'like'],
        __booleans = ['&&', '||', '|'],
        __booleans_map = {and: '&&', or: '||'},
        __join_types = ['left', 'right', 'inner'],
        __booleans_or_arr = ['||', '|', 'or'];
    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function (match) {
        return '\\' + escapes[match];
    };
    var __options = {
        expressions: [
            //{
            //    name: "总数",
            //    alias: "",
            //    fx: function (lst) {
            //        return lst.length;
            //    }
            //}
        ],
        calculations: {
            //"ITEM_CD": {
            //    name: "合计",
            //    fx: function (lst,t) {
            //        return this.sum(t,lst);
            //    }
            //},
            //"FREE_DIM_NAM1": {
            //    name: "合计",
            //    fx: function (lst,t) {
            //        return this.sum(t,lst);
            //    }
            //}
        },
        sorts: {
            //"STAT_MO": {
            //    reverse: 1,
            //    fx: function (lst) {
            //        return lst.length
            //    }
            //}
        },
        success: null
    };

    var version = "1.0.1",

    // Support: Android<4.1, IE<9
    // Make sure we trim BOM and NBSP
        r_trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

    // Define a local copy of Model
        Model = function (data) {
            // The Model object is actually just the init constructor 'enhanced'
            // Need init if Model is called (just allow error to be thrown if not included)
            return new Model.fn.init(data);
        };

    var Vendor = {
        get data() {
            return __data;
        },
        each: function () {
            Helper.each.apply(this, arguments);
        },
        sum: function (field, list) {
            var sum = 0;
            this.each(list, function (i, row) {
                if (Helper.isDefined(row[field])) {
                    sum += parseFloat(row[field]);
                }
            });
            return sum;
        }
    };

    var Log = function () {
        if (_debug) {
            var time = (new Date()).getTime();
            var arr = ["echo[" + (time - __time) + "]:"];
            for (var i in arguments) {
                arr.push(arguments[i]);
            }
            console.log.apply(this, arr);
        }
    };

    function compareFunc(param1, param2) {
        //如果两个参数均为字符串类型
        if (typeof param1 == "string" && typeof param2 == "string") {
            return param1.localeCompare(param2);
        }
        //如果参数1为数字，参数2为字符串
        if (typeof param1 == "number" && typeof param2 == "string") {
            return -1;
        }
        //如果参数1为字符串，参数2为数字
        if (typeof param1 == "string" && typeof param2 == "number") {
            return 1;
        }
        //如果两个参数均为数字
        if (typeof param1 == "number" && typeof param2 == "number") {
            if (param1 > param2) return 1;
            if (param1 == param2) return 0;
            if (param1 < param2) return -1;
        }
        return 0;
    }

    /**
     *
     * @param key
     * @param val
     * @param operator
     * @param boolean
     * @constructor
     */
    function ConditionObj(key, val, operator, boolean) {
        this.field = key;
        this.value = val;
        this.operator = operator;
        this.boolean = boolean;
    }

    /**
     *
     * @param boolean
     * @constructor
     */
    function WhereObj(boolean) {
        this.boolean = boolean;
        var _conditionArr = [];
        this.getConditionArr = function () {
            return _conditionArr;
        };
        this.addCondition = function (cond) {
            if (cond instanceof ConditionObj || cond instanceof WhereObj) {
                _conditionArr.push(cond);
            } else if (Helper.isString(cond)) {
                _conditionArr.push(eval(cond));
            }
            return this;
        };
        this.where = function (key, val, operator, boolean) {
            boolean = Algorithm.convert_boolean(boolean);
            operator = Algorithm.convert_operator(operator);
            var that = this;
            if (Helper.isObject(key)) {
                for (var k in key) {
                    that.where(k, key[k], operator, val);
                }
            } else if (Helper.isArray(key)) {
                for (var i in key) {
                    if (Helper.isDefined(key[i]['field']) && Helper.isDefined(key[i]['value'])) {
                        that.where(key[i]['field'], key[i]['value'], key[i]['operator'], key[i]['boolean']);
                    }
                }
            } else if (Helper.isString(key) && String(key).length > 0) {
                _conditionArr.push(new ConditionObj(key, val, operator, boolean));
            } else if (Helper.isFunction(key)) {
                var w_obj = new WhereObj(Algorithm.convert_boolean(val));
                _conditionArr.push(w_obj);
                key.call(w_obj);
            }
            return this;
        };
        this.queryString = function (params) {
            var str = '';
            Helper.each(this.getConditionArr(), function (i, cond) {
                var strArr = [];
                if (parseInt(i) > 0) {
                    str += ' ' + cond['boolean'] + ' ';
                }
                if (cond instanceof WhereObj) {
                    str += "(" + cond.queryString(params) + ")";
                } else if (cond instanceof ConditionObj) {
                    var field = cond['field'];
                    var value = cond['value'];
                    if (Helper.isDefined(params[field])) {
                        strArr.push(Helper.isNumber(params[field]) ? "{" + field + "}" : "'{" + field + "}'");
                        strArr.push(cond['operator']);
                        strArr.push(Helper.isNumber(cond['value']) ? cond['value'] : "'" + (cond['operator'] == 'like' ? "%" + String(cond['value']) + "%" : String(cond['value'])) + "'");
                    } else {
                        strArr.push("false");
                    }
                }
                str += strArr.join(' ');
            });
            return str;
        };
        this.isMatch = function (params) {
            var bool = false;
            Helper.each(this.getConditionArr(), function (i, cond) {
                var j_bok = false;
                if (cond instanceof WhereObj) {
                    j_bok = cond.isMatch(params);
                    //Log("WhereObj",i,j_bok);
                } else if (cond instanceof ConditionObj) {

                    var field = cond['field'];
                    var value = cond['value'];
                    if (Helper.isDefined(params[field])) {
                        // ['=','==', '===', '!=', '<', '>', '<=', '>=', '<>', '<<', '>>'];
                        switch (cond['operator']) {
                            case '=':
                            case '==':
                            case '===':
                                j_bok = params[field] == value;
                                break;
                            case '<>':
                            case '!=':
                            case '!==':
                                j_bok = params[field] != value;
                                break;
                            case '<':
                                j_bok = params[field] < value;
                                break;
                            case '<=':
                                j_bok = params[field] <= value;
                                break;
                            case '>':
                                j_bok = params[field] > value;
                                break;
                            case '>=':
                                j_bok = params[field] >= value;
                                break;
                            case '>>':
                                j_bok = params[field] >> value;
                                break;
                            case '<<':
                                j_bok = params[field] << value;
                                break;
                            case 'like':
                                value = String(value).replace(escaper, escapeChar);
                                j_bok = String(params[field]).indexOf(value) > -1;
                                break;
                            default :
                                j_bok = false;
                        }
                    }
                } else {
                    j_bok = cond;
                }
                if (i == 0) {
                    bool = j_bok;
                }
                if (Helper.inArray(cond['boolean'], __booleans_or_arr, 0) != -1) {
                    bool = bool || j_bok;
                } else if (i > 0) {
                    bool = bool && j_bok;
                }
            });
            return bool;
        }
    }

    var Helper = {
        /**
         *
         * @param elem
         * @param arr
         * @param i
         * @returns {number}
         */
        inArray: function (elem, arr, i) {
            var len;

            if (arr) {
                if ([].indexOf) {
                    return Array.prototype.indexOf.call(arr, elem, i);
                }

                len = arr.length;
                i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

                for (; i < len; i++) {
                    // Skip accessing in sparse arrays
                    if (i in arr && arr[i] === elem) {
                        return i;
                    }
                }
            }
            return -1;
        },
        /**
         *
         * @param o
         * @returns {string}
         */
        typeToString: function (o) {
            return Object.prototype.toString.call(o);
        },
        /**
         *
         * @param text
         * @returns {string}
         */
        trim: function (text) {
            return text == null ? "" : ( text + "" ).replace(r_trim, "");
        },
        /**
         *
         * @param obj
         * @returns {boolean}
         */
        isWindow: function (obj) {
            /* jshint eqeqeq: false */
            return obj != null && obj == obj.window;
        },

        /**
         *
         * @param obj
         * @returns {boolean}
         */
        isEmptyObject: function (obj) {
            var i = 0, name;
            for (name in obj) {
                i++;
                if (i > 0) return false;
            }
            return true;
        },
        /**
         *
         * @param obj
         * @returns {*}
         */
        isPlainObject: function (obj) {
            var key, that = this;

            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if (!obj || typeof (obj) !== "object" || obj.nodeType || that.isWindow(obj)) {
                return false;
            }
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            try {

                // Not own constructor property must be Object
                if (obj.constructor && !hasOwnProperty.call(obj, "constructor") && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
                    return false;
                }
            } catch (e) {

                // IE8,9 Will throw exceptions on certain host objects #9897
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            for (key in obj) {
            }

            return key === undefined || hasOwnProperty.call(obj, key);
        },

        /**
         *
         * @param o
         * @returns {boolean}
         */
        isArray: function (o) {
            return this.typeToString(o) == '[object Array]';
        },

        /**
         *
         * @param o
         * @returns {boolean}
         */
        isDefined: function (o) {
            return typeof o != 'undefined';
        },

        /**
         *
         * @returns {*|{}}
         */
        extend: function () {
            var src, copyIsArray, copy, name, options, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

            // Handle a deep copy situation
            if (typeof target === "boolean") {
                deep = target;

                // skip the boolean and the target
                target = arguments[i] || {};
                i++;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target !== "object" && !Helper.isFunction(target)) {
                target = {};
            }

            // extend itself if only one argument is passed
            if (i === length) {
                target = this;
                i--;
            }

            for (; i < length; i++) {

                // Only deal with non-null/undefined values
                if (( options = arguments[i] ) != null) {

                    // Extend the base object
                    for (name in options) {
                        src = target[name];
                        copy = options[name];

                        // Prevent never-ending loop
                        if (target === copy) {
                            continue;
                        }

                        // Recurse if we're merging plain objects or arrays
                        if (deep && copy && ( Helper.isPlainObject(copy) ||
                            ( copyIsArray = Helper.isArray(copy) ) )) {

                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && Helper.isArray(src) ? src : [];

                            } else {
                                clone = src && Helper.isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[name] = Helper.extend(deep, clone, copy);

                            // Don't bring in undefined values
                        } else if (copy !== undefined) {
                            target[name] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        },

        /**
         *
         * @param obj
         * @param callback
         * @returns {*}
         */
        each: function (obj, callback) {
            var length, i = 0;
            if (Helper.isArray(obj)) {
                length = obj.length;
                for (; i < length; i++) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            }

            return obj;
        },
        filter: function (obj, callback) {
            var result = Helper.isArray(obj) ? {} : [];
            Helper.each(obj, function (i, n) {
                if (Helper.isFunction()) {
                    result[i] = callback.call(n, n, i);
                }
            });
            return result;
        }
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
    Helper.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Object', 'Boolean'], function (i, name) {
        Helper['is' + name] = function (obj) {
            return Helper.typeToString(obj) === '[object ' + name + ']';
        };
    });

    var Algorithm = {
        extend: function () {
            Helper.extend.apply(this, arguments);
        }
    };

    Algorithm.extend({
        split_name: function (name, glue) {
            glue = glue ? glue : ' ';
            /**
             * 把多个空格的地方替换为一个空格，然后再把左右的空格去掉
             */
            name = Helper.trim(name.replace(/\s+/g, ' '));
            //按空格切割，第一个即表名，如果切割后大于1，第二个则为别名，否则表名即为别名
            var arr = name.split(glue);
            name = arr[0];
            return [name, (arr.length > 1 ? arr[1] : name)];
        },
        convert_join_type: function (join_type) {
            return Helper.inArray(String(join_type).toLocaleLowerCase(), __join_types, 0) != -1 ? join_type : __join_types[2];
        },
        convert_reverse: function (rudder) {
            return (String(rudder).toLocaleLowerCase() == 'desc' || rudder == true || rudder == 1) ? 1 : 0;
        },
        convert_boolean: function (boolean) {
            boolean = Helper.inArray(boolean, ['and', 'or'], 0) != -1 ? __booleans_map[boolean] : boolean;
            return (Helper.isString(boolean) && Helper.inArray(boolean, __booleans, 0) > -1 ? boolean : __booleans[0]);
        },
        convert_operator: function (operator) {
            return (Helper.isString(operator) && Helper.inArray(operator, __operators, 0) > -1 ? operator : __operators[0]);
        },
        convert_columns: function (row, fields) {
            var that = this;
            var columns = [];
            var _fields = fields;//should be array
            _fields = _fields.length > 0 ? _fields : ['*'];
            //field filter
            var field_count = 0;
            for (var i in _fields) {
                var field = _fields[i];
                if (Helper.isString(field)) {
                    //去掉左右空格
                    field = Helper.trim(field);
                    /**
                     * if '*', display all fields;
                     */
                    if (/^\s*\*\s*$/gi.test(field)) {
                        field_count++;
                        for (var f in row) {
                            columns.push({field: f, alias: ''});
                        }
                    } else {
                        var arr = field.replace(/^\s+(as)\s+$/i, ' as ').split(' as ');
                        columns.push({field: arr[0], alias: (arr[1] ? arr[1] : '')});
                    }
                } else if (Helper.isObject(field)) {
                    for (var f in field) {
                        columns.push({field: f, alias: Helper.isString(field[f]) ? field[f] : ''});
                    }
                }
            }
            //Log(columns);
            return columns;
        },
        groups: function (list, field, key_callback) {
            var groups = {};
            var keys = [];
            Helper.each(list, function (i, row) {
                if (Helper.isDefined(row[field])) {
                    var key = row[field];
                    if (!Helper.isDefined(groups[key])) {
                        keys.push(key);
                        groups[key] = [];
                        if (Helper.isFunction(key_callback)) {
                            key_callback.call(row, key);
                        }
                    }
                    groups[key].push(row);
                }
            });
            return groups;
        },
        qv_filter: function (list, columns, col_index, sorts_arr) {
            col_index = col_index ? col_index : 0;
            var that = this, new_list = [];
            if (columns.length > 0 && col_index < columns.length - 1) {
                /**
                 * 把第一个取出来
                 * @type {T|*}
                 */
                var column = columns[col_index];
                var field = column['field'];
                var alias = column['alias'];
                /**
                 * 先分组
                 */
                var keys = [];
                var groups = that.groups(list, field, function (key) {
                    keys.push(key);
                });

                if (keys.length > 0) {
                    /**
                     * 排序
                     */
                    var sort = that.get_sort(sorts_arr, field);
                    //Log("sort",sort);
                    if (sort !== false) {
                        var order = sort['rudder'];
                        var reverse = !1;
                        if (Helper.isObject(order)) {
                            if (Helper.isDefined(order['reverse'])) {
                                reverse = that.convert_reverse(order['reverse']);
                            }
                        } else {
                            reverse = that.convert_reverse(order);
                        }

                        if (Helper.isDefined(order['fx'])) {
                            keys = keys.sort(function (a, b) {
                                var A = parseFloat(order['fx'].call(Vendor, groups[a])), B = parseFloat(order['fx'].call(Vendor, groups[b]));
                                return (A < B ? -1 : 1) * [1, -1][+!!reverse];
                            });
                        } else {
                            keys = keys.sort(function (a, b) {
                                return compareFunc(a, b) * [1, -1][+!!reverse];
                            });
                            //Log(keys);
                        }
                    }

                    /**
                     * 遍历输出
                     */
                    Helper.each(keys, function (i, k) {
                        var lst = groups[k];
                        /**
                         * 如果还有维度，则继续深度排取
                         */

                        var _lst = that.qv_filter(lst, columns, col_index + 1, sorts_arr);

                        if (Helper.isDefined(__options.calculations[field])) {
                            var calculation = __options.calculations[field];
                            var temp = Helper.isArray(_lst[0]) ? _lst[0] : _lst[0].data;
                            var total_obj = {data: []};
                            Helper.each(temp, function (t, m) {
                                if (t < col_index) {
                                    total_obj.data[t] = m;
                                } else if (t == col_index) {
                                    total_obj.data[t] = calculation['name'];
                                } else if (t > columns.length - 1) {
                                    total_obj.data[t] = Helper.isFunction(calculation['fx']) ? calculation['fx'].call(Vendor, _lst, t) : '';//Vendor.sum(t, _lst);
                                } else {
                                    total_obj.data[t] = '';
                                }
                            });
                            new_list.push(total_obj);
                        }
                        Helper.each(_lst, function (j, row) {
                            new_list.push(row);
                        });

                    });
                } else {
                    return that.qv_filter(list, columns, col_index + 1, sorts_arr);
                }
            } else {
                //最后一列
                var _row = [];
                Helper.each(columns, function (n, m) {
                    var f = m['field'];
                    _row.push(list[0][f]);
                });
                /**/
                Helper.each(__options.expressions, function (j, express) {
                    if (Helper.isDefined(express['fx'])) {
                        _row.push(express['fx'].apply(Vendor, [list]));
                    }
                });
                /**/
                new_list.push(_row);
            }
            return new_list;
        },
        /**
         *
         * @param list1
         * @param key1
         * @param list2
         * @param key2
         * @param join_type
         * @param row_callback
         * @returns {Array}
         */
        join: function (list1, key1, list2, key2, join_type, row_callback) {
            var that = this, result = [], row2_temp = list2[0];// Object.keys(list2[0]);
            var groups = that.groups(list2, key2);
            //Log(key1,key2,list1);

            Helper.each(list1, function (i, row1) {
                var val = row1[key1];
                //if it's matched
                if (Helper.isDefined(groups[val])) {
                    //Log(val);
                    Helper.each(groups[val], function (j, row2) {
                        if (Helper.isFunction(row_callback)) {
                            result.push(Helper.extend({}, row_callback.apply(Helper, [row1, row2, true])));
                        }
                    });
                } else if (Helper.inArray(join_type, ['left', 'right'], 0) != -1 && Helper.isFunction(row_callback)) {
                    result.push(Helper.extend({}, row_callback.apply(Helper, [row1, row2_temp, false])));
                }
            });
            return result;
        },
        /**
         *
         * @param list
         * @param order_by_arr
         * @param order_by_i
         * @param wheres
         * @returns {*}
         */
        order_by: function (list, order_by_arr, order_by_i, wheres) {
            order_by_i = order_by_i ? order_by_i : 0;
            var that = this, new_list = [];
            if (order_by_arr.length > 0 && order_by_i < order_by_arr.length) {
                /**
                 * 把第一个取出来
                 * @type {T|*}
                 */
                var sort = order_by_arr[order_by_i];
                var field = sort['field'];
                //var reverse = that.convert_reverse(sort['rudder']);
                /**
                 * 先分组
                 */
                var keys = [];
                var groups = that.groups(list, field, function (key) {
                    keys.push(key);
                });


                if (keys.length > 0) {
                    /**
                     * 排序
                     */
                    var order = sort['rudder'];
                    var reverse = !1;
                    if (Helper.isObject(order)) {
                        if (Helper.isDefined(order['reverse'])) {
                            reverse = that.convert_reverse(order['reverse']);
                        }
                    } else {
                        reverse = that.convert_reverse(order);
                    }

                    if (Helper.isDefined(order['fx'])) {
                        keys = keys.sort(function (a, b) {
                            var A = parseFloat(order['fx'].call(Vendor, groups[a])), B = parseFloat(order['fx'].call(Vendor, groups[b]));
                            return (A < B ? -1 : 1) * [1, -1][+!!reverse];
                        });
                    } else {
                        keys = keys.sort(function (a, b) {
                            return compareFunc(a, b) * [1, -1][+!!reverse];
                        });
                        //Log(keys);
                    }

                    /**
                     * 遍历输出
                     */
                    Helper.each(keys, function (i, k) {
                        var lst = groups[k];
                        /**
                         * 如果还有，则继续深度排取
                         */
                        if (order_by_i < order_by_arr.length - 1) {
                            var _lst = that.order_by(lst, order_by_arr, order_by_i + 1, wheres);
                            Helper.each(_lst, function (j, row) {
                                new_list.push(row);
                            });
                        } else {
                            Helper.each(lst, function (i, row) {
                                /**/
                                if (that.is_match(row, wheres)) {
                                    new_list.push(row);
                                }
                            });
                        }
                    });
                } else {
                    return that.order_by(list, order_by_arr, order_by_i + 1, wheres);
                }
            } else {

                Helper.each(list, function (i, row) {
                    /**/
                    if (that.is_match(row, wheres)) {
                        new_list.push(row);
                    }
                });
            }
            return new_list;
        },
        get_sort: function (sorts, field) {
            var bok = false;
            Helper.each(sorts, function (i, sort) {
                if (sort['field'] == field) {
                    bok = sort;
                    return false;
                }
            });
            return bok;
        },
        is_match: function (params, wheres) {
            var that = this, bool = true, n = 0;
            Helper.each(wheres, function (i, w_obj) {
                if (w_obj instanceof WhereObj) {
                    if (n == 0) {
                        bool = w_obj.isMatch(params);
                    } else if (Helper.inArray(w_obj['boolean'], __booleans_or_arr, 0) != -1) {
                        bool = bool || w_obj.isMatch(params);
                    } else {
                        bool = bool && w_obj.isMatch(params);
                    }
                    n++;
                }
            });
            return bool;
        },
        get_sql: function (params, wheres) {
            var sqlArr = [];
            Helper.each(wheres, function (i, w_obj) {
                if (w_obj instanceof WhereObj) {
                    if (sqlArr.length > 0) {
                        sqlArr.push(w_obj.boolean);
                    }
                    sqlArr.push(w_obj.queryString(params));
                }
            });
            return sqlArr.join(' ');
        }
    });

    Model.fn = Model.prototype = {
        // The current version of Model being used
        model: version,

        constructor: Model,
        // Execute a callback for every element in the matched set.
        extend: function () {
            return Helper.extend.apply(this, arguments);
        },
        init: function (data) {
            var that = this;
            that.clear();
            that.table(data);
            __time = (new Date()).getTime();
            return this;
        }
    };

    Model.fn.extend({
        /**
         * clear bindings
         * @returns {*}
         */
        clear: function () {
            var that = this;
            that.bindings = {
                where: [], //condition
                wheres: [], //condition
                fields: [], // select fields
                limit: [], //paging
                order_by: [] //sort by
            };
            return this;
        },
        /**
         * set table
         * @param data
         * @param t_name
         * @returns {*}
         */
        table: function (data, t_name) {
            var that = this;
            __data = data;
            t_name = Helper.trim(t_name);
            if (Helper.isString(t_name) && t_name != '') {
                var t_name_arr = Algorithm.split_name(t_name, ' ');
                t_name = t_name_arr[0];
                var t_alias = t_name_arr[1];
                //保存表名
                __table_alias_names[t_alias] = t_name;
            }
            return that;
        },
        /**
         * quick view
         * @param options
         * @returns {*}
         */
        view: function (options) {
            var that = this;
            var columns = Algorithm.convert_columns(__data[0], that.bindings['fields']);
            var headFields = [], list = [];
            Helper.each(columns, function (i, c) {
                headFields.push(c['alias'] != '' ? c['alias'] : c['field']);
            });
            Helper.each(__options.expressions, function (i, n) {
                headFields.push(n.name);
            });
            __options = Helper.extend({}, __options, options);

            list = Algorithm.qv_filter(__data, columns, 0, that.bindings['order_by']);

            if (Helper.isFunction(__options.success)) {
                __options.success.apply(that, [list, headFields]);
            }

            return that;
        },
        /**
         * set fields
         * @param fields
         * @returns {*}
         */
        fields: function (fields) {
            var that = this;
            if (Helper.isString(fields) || Helper.isObject(fields)) {
                that.bindings['fields'].push(fields);
            } else if (Helper.isArray(fields)) {
                Helper.each(fields, function (i, field) {
                    that.fields(field);
                });
            }
            return this;
        },
        /**
         * join other table
         * @param key1
         * @param list2
         * @param key2
         * @param join_type
         * @returns {*}
         */
        join: function (key1, list2, key2, join_type) {
            var that = this;

            join_type = Algorithm.convert_join_type(join_type);
            var t2_arr = Algorithm.split_name(key2, '.');
            var t2_alias = t2_arr[0];
            key2 = t2_arr[1];
            var get_new_row = function (one, second, is_matched) {
                var obj = {};
                for (var lf in one) {
                    obj[lf] = one[lf];
                }
                for (var rf in second) {
                    obj[t2_alias + '.' + rf] = (is_matched == true ? second[rf] : null);
                }
                return obj;
            };

            if (join_type == 'right') {
                __data = Algorithm.join(list2, key2, __data, key1, join_type, get_new_row);
            } else {
                __data = Algorithm.join(__data, key1, list2, key2, join_type, get_new_row);
            }
            Log("__data.length", __data.length);
            return that;
        },
        /**
         * set order by
         * @param field
         * @param rudder
         * @returns {*}
         */
        order_by: function (field, rudder) {
            var that = this;
            if (Helper.isArray(field)) {
                Helper.each(field, function (i, f) {
                    that.order_by(f, rudder);
                });
            } else if (Helper.isObject(field)) {
                Helper.each(field, function (f, d) {
                    that.order_by(f, d);
                })
            } else if (Helper.isString(field)) {
                that.bindings['order_by'].push({"field": field, "rudder": rudder});
            }
            return this;
        },
        where: function (field, val, operator, boolean) {
            var that = this;
            boolean = Algorithm.convert_boolean(boolean);
            operator = Algorithm.convert_operator(operator);
            //that.bindings['where'] is an array.
            if (Helper.isObject(field)) {
                for (var k in field) {
                    that.where(k, field[k], operator, Algorithm.convert_boolean(val));
                }
            } else if (Helper.isArray(field)) {
                for (var i in field) {
                    if (Helper.isDefined(field[i]['field']) && Helper.isDefined(field[i]['value'])) {
                        that.where(field[i]['field'], field[i]['value'], field[i]['operator'], field[i]['boolean']);
                    }
                }
            } else if (Helper.isString(field) && String(field).length > 0) {
                that.bindings['where'].push((new WhereObj(boolean)).where(field, val, operator, boolean));
            } else if (Helper.isFunction(field)) {
                var w_obj = new WhereObj(Algorithm.convert_boolean(val));
                var w_obj2 = new WhereObj(Algorithm.convert_boolean(val));
                w_obj.addCondition(w_obj2);
                that.bindings['where'].push(w_obj);
                field.call(w_obj2);
            }
            return this;
        },
        where_in: function (field, values, boolean) {
            var that = this;
            if (Helper.isString(field)) {
                that.where(function () {
                    if (Helper.isArray(values)) {
                        for (var k in values) {
                            this.where(field, values[k], __operators[0], '||');
                        }
                    }
                }, boolean);
            }
            return this;
        },
        where_not_in: function (field, values, boolean) {
            var that = this;
            if (Helper.isString(field)) {
                that.where(function () {
                    if (Helper.isArray(values)) {
                        for (var k in values) {
                            this.where(field, values[k], '!=');
                        }
                    }
                }, boolean);
            }
            return this;
        },
        where_between: function (field, range) {
            var that = this;
            if (Helper.isArray(range) && range.length > 1) {
                that.where(function () {
                    this.where(field, Math.min(range[0], range[1]), '>');
                    this.where(field, Math.max(range[0], range[1]), '<');
                });
            }
            return this;
        },
        where_like: function (field, val, boolean) {
            var that = this;
            that.where(field, val, 'like', boolean);
            return that;
        },
        limit: function (offset, size) {
            var that = this;
            if (arguments.length == 1) {
                that.bindings['limit'] = [0, Math.max(0, offset)];
            } else if (arguments.length > 1) {
                that.bindings['limit'] = [Math.max(0, offset), Math.max(0, offset + size)];
            }
            return this;
        },
        get: function () {
            var that = this;
            var list = Algorithm.order_by(__data, that.bindings['order_by'], 0, that.bindings['where']);
            if (that.bindings['limit'].length > 0) {
                list = list.slice(that.bindings['limit'][0], that.bindings['limit'][1]);
            }
            //that.clear();
            console.log(list)
            return list;
        },
        find: function (where) {
            var that = this;
            return that.where(where).get()[0];
        },
        fetch: function (fetch_fn) {
            var that = this;
            var list = that.get();
            if (Helper.isFunction(fetch_fn)) {
                Helper.each(list, fetch_fn);
                return that;
            }
            return list;
        },
        select: function (fields, where) {
            return this.fields(fields).where(where).get();
        },
        count: function () {
            return this.get().length;
        },
        toSql: function (bool) {
            var sql = Algorithm.get_sql(__data[0], this.bindings['where']);
            if (bool == true) {
                console.log(sql);
                return this;
            }
            return sql;
        }
    });

    // Give the init function the iModel prototype for later instantiation
    Model.fn.init.prototype = Model.fn;

    Model.fn.size = function () {
        return this.length;
    };

// Register as a named AMD module, since Model can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase model is used because AMD module names are
// derived from file names, and Model is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of Model, it will work.

// Note that for maximum portability, libraries that are not Model should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. Model is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

    if (typeof define === "function" && define.amd) {
        define("model", [], function () {
            return Model;
        });
    }


    var

    // Map over Model in case of overwrite
        _Model = window.Model,

    // Map over the M in case of overwrite
        _M = window.M;

    Model.noConflict = function (deep) {
        if (window.M === Model) {
            window.M = _M;
        }

        if (deep && window.Model === Model) {
            window.Model = _Model;
        }

        return Model;
    };

    if (!noGlobal) {
        window.Model = window.M = Model;
    }

    return Model;
}));
