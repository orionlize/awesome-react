**解决Import冲突**  
- import imported 导出名 local 本地名
- set保存所有导出的变量名 namespace 入口 entry 包含entry所以的变量
- 每个作用域保存定义的变量名和作用域是否为module
- 每次使用变量时向上查询是否是导出变量获取真正的名字替换