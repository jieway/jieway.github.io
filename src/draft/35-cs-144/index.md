---
title: 'CS144'
date: '2024-01-22'
---


- 创建一个目录以编译实验软件：`cmake -S . -B build`
- 编译源代码：`cmake --build build`
- 在提交任务之前，运行 `cmake --build build --target tidy` 以获取有关如何改进与C++编程实践相关的代码的建议。
- 运行 `cmake --build build --target format` 以使代码格式一致。


请阅读 `util/socket.hh` 和 `util/file descriptor.hh` 文件中的公共接口部分（即“public:”之后的部分）。 （请注意，Socket是FileDescriptor的一种类型，而TCPSocket是Socket的一种类型。）

1. 从构建目录中，在文本编辑器或IDE中打开文件 ../apps/webget.cc。
2. 在get URL函数中，找到以“// Your code here.”开头的注释。
3. 根据文件中描述的方式实现简单的Web客户端，使用您之前使用的HTTP（Web）请求的格式。使用TCPSocket和Address类。
4. 提示：
   - 请注意，在HTTP中，每行都必须以“\r\n”结尾（仅使用“\n”或endl是不够的）。
   - 不要忘记在客户端请求中包含“Connection: close”行。这告诉服务器不要在此请求之后等待客户端发送更多请求。相反，服务器将发送一个响应，然后立即结束其传出字节流（从服务器套接字到您的套接字的字节流）。当您已经读取来自服务器的整个字节流时，您的套接字将达到“EOF”（文件结束），这就是您的客户端知道服务器已完成其回复的方式。
   - 确保读取并打印来自服务器的所有输出，直到套接字达到“EOF”（文件结束）——仅调用一次read是不够的。
   - 我们预计您需要编写大约十行代码。
5. 通过运行make编译您的程序。如果看到错误消息，您需要在继续之前修复它。
6. 运行./apps/webget cs144.keithw.org /hello来测试您的程序。这与在Web浏览器中访问http://cs144.keithw.org/hello时有何不同？它与第2.1节的结果相比如何？随意尝试—可以使用任何http URL进行测试！
7. 当它似乎正常工作时，运行cmake --build build --target check_webget来运行自动化测试。在实现get URL函数之前，您应该期望看到以下内容：

    ```
    $ cmake --build build --target check_webget
    Test project /home/cs144/minnow/build
        Start 1: compile with bug-checkers
    1/2 Test #1: compile with bug-checkers ........
        Start 2: t_webget
    2/2 Test #2: t_webget .........................***Failed
    Function called: get_URL(cs144.keithw.org, /nph-hasher/xyzzy)
    Warning: get_URL() has not been implemented yet.
    ERROR: webget returned output that did not match the test's expectations
    ```

8. 评分员将使用与make check webget运行不同的主机名和路径运行您的webget程序，因此确保它不仅适用于单元测试中使用的主机名和路径。

完成了此任务之后，您已经看到了可靠字节流的抽象如何在通过互联网进行通信时非常有用，即使互联网本身只提供“最大努力”（不可靠）的数据报服务。

为了完成本周的实验，您将在单台计算机上的内存中实现一个提供此抽象的对象。您的字节流将在“输入”侧写入，可以在“输出”侧以相同的顺序读取。字节流是有限的：写入者可以结束输入，然后不能再写入更多字节。当读者读取到流的末尾时，它将达到“EOF”（文件结束），并且无法再读取更多字节。

您的字节流还将进行流控制，以限制其在任何给定时间内的内存消耗。对象将以特定的“容量”初始化：在任何给定时刻它愿意在自己的内存中存储的最大字节数。字节流将限制写入者在任何给定时刻写入多少字节，以确保流不超过其存储容量。当读者读取字节并从流中排空它们时，写入者被允许写入更多字节。您的字节流用于单线程 - 您不必担心并发写入者/读者、锁定或竞争条件。

要明确：字节流是有限的，但在写入者结束输入并完成流之前，它可以几乎是任意长的。容量限制了在任何给定时刻在内存中保留的字节数（已写入但尚未读取），但不限制流的长度。只有一个字节容量的对象仍然可以携带长度为数千兆字节的流，只要写入者一次写入一个字节，读者在允许写入下一个字节之前读取每个字节。

下面是写入者的接口：

```
void push(std::string data); // 将数据推送到流中，但仅限于可用容量允许的范围内。
void close(); // 表示流已达到结束。不会再写入更多数据。
void set_error(); // 表示流遇到错误。
bool is_closed() const; // 流是否已关闭？
uint64_t available_capacity() const; // 现在可以推送到流中的字节数是多少？
uint64_t bytes_pushed() const; // 总共已推送到流中的字节数
```

以下是读者的接口：

```
std::string_view peek() const; // 查看缓冲区中的下一批字节
void pop(uint64_t len); // 从缓冲区中删除`len`字节
bool is_finished() const; // 流是否已完成（关闭并完全弹出）？
bool has_error() const; // 流是否发生错误？
uint64_t bytes_buffered() const; // 当前缓冲的字节数（已推送但未弹出）
uint64_t bytes_popped() const; // 从流中累积弹出的总字节数
```

请打开src/byte stream.hh和src/byte stream.cc文件，并实现一个提供此接口的对象。在开发字节流实现时，您可以使用cmake --build build --target check0运行自动化测试。

如果所有测试都通过，check0测试将运行您的实现的速度基准测试。在本课程的情况下，任何快于0.1 Gbit/s（换句话说，每秒1亿位）的速度都是可以接受的。 （实际上，实现可能会比10 Gbit/s更快，但这取决于您计算机的速度，不是必需的。）

如有任何突发问题，请查看课程网站上的实验FAQ或向您的同学、实验室工作人员寻求帮助（或在EdStem上）。接下来会发生什么？在接下来的四周里，您将实现一个系统，该系统在不再位于内存中，而是在不可靠的网络上提供相同的接口。这就是传输控制协议（TCP） - 其实现可以说是世界上最普遍的计算机程序。

提交
在你的提交中，请只对 `webget.cc` 和 `src` 目录顶层的源代码文件（`byte stream.hh` 和 `byte stream.cc`）进行更改。请不要修改任何测试或 `util` 目录中的辅助文件。

在提交任何作业之前，请按以下顺序运行这些命令：
（a）确保你已经提交了所有的更改到 Git 仓库中。你可以使用 `git status` 来确保没有未提交的更改。记住：在编写代码时进行小的提交。
（b）使用 `cmake --build build --target format` 来规范化编码风格。
（c）使用 `cmake --build build --target check0` 来确保自动化测试通过。
（d）可选：使用 `cmake --build build --target tidy` 来获得建议，以遵循良好的 C++ 编程实践。

编辑 `writeups/check0.md` 文件，提供信息，如完成本次作业所花费的小时数以及任何其他评论或见解。

有关“如何提交”的详细操作将在截止日期之前宣布。

如果遇到任何问题，请尽快在实验课上通知课程工作人员，或在 EdStem 上发布问题。祝你好运，欢迎来到 CS144！