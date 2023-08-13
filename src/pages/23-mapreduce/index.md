---
title: 'Map Reduce Notes'
date: '2022-01-12'
---

# 总览

Map Reduce 的重要意义是实现了计算的水平扩展，主要分为三部分：map 过程，reduce 过程，容错。worker 从 master 处获取 map 任务，执行完毕后通知 master 。需要设计一个结构体，用来表示 task 。如果用一个 task 表示 map 或 reduce 那么就需要一个字段来表示 task 类型，也可以分开设计。

worker 通过 rpc 从 master 处获取 task 随后处理这个 task 。整体分为两阶段，先执行 map task 再执行 reduce task。执行完 map task 后通知 master 任务执行完毕，master 更新对应 task 的状态，随后 worker 获取新的任务继续执行。worker 如果长时间没有响应，例如 10s 就需要撤销任务，所以可以设置一个时间间隔，判断 worker 是否正在做任务。

## 实现过程中会遇到的问题

1. 为什么需要 map task 全部做完后才能做 reduce task ？

因为 map task 没有做完 worker 就开始执行 reduce task ，这个 reduce task 的数据不是完整的情况。也就是需要保证 worker 在执行 map 任务所产生的中间文件存在对所有 reduce 任务产生影响的可能。所以需要 map task 全部完成后才能执行 reduce task 。

2. map 任务产生中间文件的命名方式和 reduce 任务读取中间文件的逻辑是什么？

map 过程会将产生的中间文件对 reduce 任务个数取余，这样做是为了将数据均匀分散，避免某个 reduce 任务负担过重。即遍历 N 个 reduce 任务将其写入中间文件中。reduce 过程是反过来的，需要遍历 reduce id 对应的所有的 map 任务产生的中间文件，所以需要记录 map 任务的总个数。

3. 文件存放在哪里？

如果用单机多进程来模拟，因为都在同一台机器上，所以不用考虑这个问题。但是如果在不同物理机上执行就需要一个全局的文件系统了，文章中用的是 GFS 。

4. 下面是两个具体执行过程中的例子。

Map 函数处理键值对并生成中间的键值对，Reduce 函数将所有键相同的中间的键值对合并起来。这两个函数都是暴露给用户，由用户来提供具体的处理逻辑。以词频统计为例，Map 函数负责构造键值对，其中 Key 是 word ，Value 是 1 。reduce 负责将 Key  相同的 Value 累加起来。以 URL 访问频数为例，Key 是 URL，Value 则是访问访问次数。