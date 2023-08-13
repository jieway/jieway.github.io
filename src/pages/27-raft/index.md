---
title: 'Raft summary'
date: '2023-08-10'
---

# 简介

Raft 是一个共识算法，共识算法很重要。因为 Paxos 难以理解，所以设计了 Raft 。Raft 在保证结果和效率同 Paxos 等价的基础上降低了理解上的难度。Raft 可以拆分为领导选举，日志复制和安全三部分。

## 复制状态机

在分布式系统中，一个数据分为多个副本，共识算法作用在多个副本上，使得所有副本执行相同的命令进而确保不同副本之间的数据保持一致。使用日志来记录命令，leader 将日志复制到其他服务器上。leader 如果挂掉会选出新的 leader ，但新旧 leader 的日志不一定一致，所以需要调整确保所有日志都一致后才能继续处理客户端的请求。

## Paxos VS Raft 

同 Paxos 相比，Raft 将算法拆解为更容易理解的子问题。使用随机定时器，而非基于唯一标识符或基于优先级的方法，避免了一些错误，且更容易理解。在 Raft 中，节点之间的通信和心跳是通过随机定时器来触发的，而不是像 Paxos 那样使用基于唯一标识符或优先级的方法。这使得 Raft 的实现更加容易，因为节点可以定期发送心跳，以确保彼此的活动状态。相比之下，Paxos 的消息序列和选举过程可能更难以直观地理解和实现。Raft 在设计上避免了一些 Paxos 中可能出现的复杂性和问题。例如，在 Paxos 中，领导选举和日志复制可能需要额外的协调来处理失败情况。而 Raft 的设计则更加注重在节点失效和网络分区等故障情况下的正确性和可用性。


## Raft 基础知识

服务器有 leader，follower 和 candidate 三种状态。通常系统中只有一个 Leader，其他均为 follower。follower 被动的响应 leader 或 candidate 的请求。日志由 entry 组成，每个 entry 都有一个连续递增的索引，可以把 entry 分为已经执行且提交的和还未被执行两部分。Leader 接受来自客户端的命令，将其追加到日志中，然后确保其他服务器的日志保持一致，随后执行该日志，最后将执行结果返回给客户端。这样使得没台服务器都会按照同一个顺序执行相同的命令。

网络通信类型：

- 存在两种网络通信，使用 RequestVote RPC 来选择新的 Leader。
- 使用两个额外的 RPC: AppendEntries RPC 用来复制日志,InstallSnapshot RPC 用来增加快照的效率。

## 如何选出一个 Leader ？

服务器启动时所有节点都是 follower 状态，随着时间推移如果始终没有收到心跳包那么该 follower 会认为该系统中没有 leader 进而转为 candidate 来竞争 leader 。在这个过程中，follower 会率先增加任期，随后向其他服务器发送 RequestVote RPC 从而获取选票。其他服务器收到选票后会判断任期和自己的一样新会投票，当前任期内没有投票也投票，但是任期号小于自己则拒绝。

请求投票的获得 (N/2)+1(其中N是服务器的数量) 即可成为 leader 。为了确保只有 leader 选出，一旦某个 follower 接受了来自某个 candidate 的 RequestVote,它就会拒绝其他candidate的 RequestVote。所以 candidate只能从没有在当前任期投过票的follower获得选票,

每个 follower 投出选票后发现一个任期号更大的投票出现，那么会撤销之前的投票选投更大的，这回导致选票被瓜分。可以设置每个 candidate 发起选举前设置一个超时时间，进而避免这种情况。

选出 leader 后，该 leader 会不断的向其他服务器发送心跳包，即不包含日志项内容的 AppendEntries RPC 从而使得其他 follower 知晓 leader 的存在不发起选举。一个任期内最多只允许一个 leader 若在一个任期内没有选出就跳过进行下一个任期重新开始。follower 只有在当前任期中没有投过票才能成为 candidate 。


