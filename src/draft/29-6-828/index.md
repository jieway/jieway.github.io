---
title: 'MIT 6.828'
date: '2023-08-10'
---

# MIT 6.828 

- [schedule](https://pdos.csail.mit.edu/6.828/2018/schedule.html)

共有 6 个 lab ，最终实现一个非宏内核 OS 。

1. lab1 OS 启动过程，boot loader，内核。
2. lab2 内存管理，物理内存，虚拟地址，内核地址空间。
3. lab3 用户环境，异常处理，页错误，断点，异常，系统调用。
4. lab4 抢占式多任务处理，多核，COW，进程间通信。
5. lab5 文件系统。
6. lab6 网络驱动，

## Lab 0: 环境配置

最省事的就是买一个云服务器，Ununtu 20.04 ，不踩坑的情况下二十分钟搞定。

ubuntu20.04 (如果是 windows 建议 WSL2，如果是 MacOS 建议买个云服务器)

## Lab 1: Booting a PC

lab1: https://pdos.csail.mit.edu/6.828/2018/labs/lab1/

`make qemu-nox` 使用 `ctrl + a x` 可以退出 qemu 。

左边窗口输入 `make qemu-nox-gd` ，右边窗口输入 `make gdb` 。




## 3. 参考

* 《操作系统真相还原》
* [linux-insides](https://github.com/0xAX/linux-insides)


* 为什么 16 位的内存地址却能处理 1MB 的物理内存？

> 因为地址线是 20 位，所以地址空间是 $2^{20}$ ，即 $1MB$ 。因为地址空间只有 1MB ，所以内存空间从 `0x00000000` 开始到 `0x000FFFFF` 结束。早期 PC 的数据线是 16 位，所以一次只能取 $2^{16}$ 大小的数据，即 640KB 大小。32 位 PC 的地址空间是 32 位，所以大小为 $4G = 2^32$ 。物理空间从 `0x00000000` 开始，到 `0xFFFFFFFF` 结束。
> 
> 在16位内存地址系统中，内存被分为两部分：一个段地址和该段内的偏移量。段地址用于定位内存中的段，偏移量用于定位该段中的特定字节。使用这种技术，每个段可以有多达64KB的内存，而内存的大小可以达到1MB，因为有多达65536（2^16）个可能的段地址。
> 
> 换句话说，物理内存的每个区段都被分配了一个唯一的16位区段地址，而区段内的内存位置则由偏移地址确定。通过结合段地址和偏移地址，系统可以访问整个1MB的内存。

1. [0x00000000, 0x000A0000 (640KB)] 称为 "Low Memory" ,早期 PC 唯一可用的随机存取存储器。实际上，最初的 PC 内存大小通常为 16 KB， 32 KB 或 64KB 的 RAM 。
2. [0x000A0000, 0x000FFFFF] 例如视频显示的缓冲区。
   1. 0x000F0000 到 0x000FFFFF 留给了 Basic Input/Output System (BIOS) 。起初这片区域是用 ROM 来实现的，也就是只能读不能写，而目前是用 flash 来实现，读写均可。此外 BIOS 负责初始化，初始化完成后会将 OS 加载到内存中，此后将控制权交给 OS 。
3. 随着时代的发展，PC 开始支持 4GB 内存，所以地址空间扩展到了 0xFFFFFFFF 。
   1. 为了兼容已有的软件，保留了 0 - 1MB 之间的内存布局。0x000A0000 到 0x00100000 这区域看起来像是一个洞。
   2. 前 640kb 是传统内存，剩余的部分是扩展内存。
   3. 在 32 位下，PC 顶端的一些空间保留给 BIOS ，方便 32 位 PCI 设备使用。但是支持的内存空间已经超过了 4GB 的物理内存，也就是物理内存可以扩展到 0xFFFFFFFF 之上。
   4. 但是为了兼容 32 位设备的映射，在 32 位高地址部分留给 BIOS 的这片内存区域依旧保留，看起来像第二个洞。
   5. 本实验中， JOS 只使用了前 256MB，可以假设只有 32 位的物理内存。

### 2.4 The ROM BIOS

这一部分将会使用 qemu 的 debug 工具来研究计算机启动。

在 lab 目录下使用 tmux 打开两个窗口输入下述内容：

    tmux
    ctrl + b %

一个窗口输入 `make qemu-gdb`（或 `make qemu-nox-gdb`）。这样就启动了QEMU，但是 QEMU 在处理器执行第一条指令之前就停止了，等待来自GDB的调试连接。在第二个终端运行 `make gdb` 将会输出下述内容：

    athena% make gdb
    GNU gdb (GDB) 6.8-debian
    Copyright (C) 2008 Free Software Foundation, Inc.
    License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
    This is free software: you are free to change and redistribute it.
    There is NO WARRANTY, to the extent permitted by law.  Type "show copying"
    and "show warranty" for details.
    This GDB was configured as "i486-linux-gnu".
    + target remote localhost:26000
    The target architecture is assumed to be i8086
    [f000:fff0] 0xffff0:	ljmp   $0xf000,$0xe05b
    0x0000fff0 in ?? ()
    + symbol-file obj/kern/kernel
    (gdb) 

`.gdbinit` 文件中设置了 GDB 来调试早期启动时使用的 16 位代码，并指示它附加到监听的 QEMU。(如果它不工作，需要在主目录下的 .gdbinit 中添加一个添加自动加载安全路径使得 gdb 能够处理 `.gdbinit` 。gdb 会告诉你是否必须这样做)。

下面这一行。

    [f000:ff0] 0xffff0: ljmp $0xf000,$0xe05b

这是 GDB 反汇编出来的第一条指令，从中可以得出如下结论：

- PC 从物理地址 `0x000ffff0` 处开始执行，处于 ROM BIOS保留的64KB区域的最顶端。
- PC 从 `CS=0xf000` 和 `IP=0xfff0` 处开始执行。
- 第一条执行的指令是 jmp，跳转到分段地址 `CS=0xf000` 和 `IP=0xe05b` 。

为什么 QEMU 会这样开始？

Intel 的 8088 处理器起初是这样设计的。因为 BIOS 处于 `0x000f0000` 和 `0x000fffff` 之间。这样设计确保了 PC 启动或重启都能获得机器的控制权，这一点很重要，机器的 RAM 中没有其他软件可供处理器执行。

QEMU 模拟器有自己的 BIOS，它把它放在处理器的模拟物理地址空间的这个位置上。在处理器复位时，（模拟的）处理器进入真实模式，并将CS设置为0xf000，IP设置为0xfff0，这样就在该（CS:IP）段地址开始执行。

地址`0xf000:0xfff0`被选择为复位向量，因为它位于上层内存区，该区被保留给系统使用，通常不用于通用内存分配。这有助于确保复位向量不会被用户代码或数据所覆盖。

在8088处理器的情况下，复位向量被硬连接到处理器本身，不能被改变。这意味着，当处理器被重置时，它将总是从`CS=0xf000`和`IP=0xfff0`开始执行代码。

复位向量是一个内存位置，它包含了程序计数器（PC）或指令指针（IP）和代码段（CS）寄存器的初始值。这些值决定了复位事件后程序执行的起始点，如开机复位或硬件复位。

复位向量为处理器提供了一种方法，在复位后在一个已知的位置开始执行代码，使系统能够自我初始化并开始运行操作系统或其他软件。复位向量的地址通常是固定的，并在处理器的文档中指定。

在计算机系统中，复位向量通常位于内存中的一个固定地址，包含启动代码的起始地址，负责初始化系统和加载操作系统或其他软件。处理器复位和重启都是为了使系统回到初始状态，准备运行新的程序。不同的是，处理器复位只影响处理器的状态，而重启则影响整个系统的状态。

分段地址 `0xf000:ffff0` 是如何变成物理地址的？这里面有一个公式：

    物理地址 = 16 * segment + offset

例如：

    16 * 0xf000 + 0xfff0   # 这是 16 进制
    = 0xf0000 + 0xfff0     # 仅仅是左移一位
    = 0xffff0 

在实模式下使用段式内存管理。因为数据线为 16 位，所以一次只能取 $2^{16}$ 的数据，即 64KB 。而地址线是20 位，即 $2^{20}$ ，也就是一个16 位的数据无法一次性索引 20 位的地址空间。解决方案是分段，一个寄存器表示段基地址，另一个寄存器表示段偏移量，其中段基址左移四位(16 进制下就是左移一位)再加上段内偏移即可。段基址不一定是 65536 的倍数，因为段允许**重叠**。

注意左移四位在 16 进制下就是左移一位，其实就是让出高位。对于 0xf000 而言用 f 表示最高位。

0xffff0 是 BIOS 结束前的16个字节（0x100000）也是 PC 开始执行的第一条指令地址。如果继续向后执行， 16 字节 BIOS 就结束了，这么小的空间能干什么？

> Exercise 2.
> 
> 使用GDB的 si(Step Instruction) 命令追踪到 ROM BIOS 中的几个指令，并尝试猜测它可能在做什么。
> 可以参考 Phil Storrs I/O 中关于端口的描述，以及[6.828参考资料页面](https://pdos.csail.mit.edu/6.828/2018/reference.html)上的其他资料。
> 
> 不需要弄清楚所有的细节--只需要先弄清楚BIOS在做什么的大概意思。

使用 si 逐行查看指令。这些汇编代码是实现引导程序的代码，用于在启动电脑之后将控制权转移到内存的不同位置。代码实现了以下操作：跳转到内存的不同位置、对于一些指令，在特定条件下执行跳转操作、清零寄存器、将 esp 寄存器指向栈顶、设置 edx 寄存器、关闭硬件中断、设置方向标志、关闭不可屏蔽中断、启动 A20 地址线、加载到 IDT 和 GDT 表、打开保护模式并进入保护模式

清零寄存器是初始化的一部分，为了防止因为前面的程序运行影响到当前程序的执行，在进入新的程序之前清零寄存器是很有必要的。此外，因为很多指令只能在特定的寄存器设置下才能正常执行，因此清零寄存器也有助于程序的可移植性。

将 ESP 寄存器指向栈顶可以确保当前程序使用栈时，栈始终在内存的合适位置。此外，如果不这样做，程序可能会出现栈溢出，这是一种严重的编程错误，可能导致程序崩溃或执行不正确的操作。

在操作系统的引导过程中，关闭硬件中断是一种保护机制，以防止在初始化系统之前发生不必要的硬件中断。在引导过程中，操作系统的内存布局和寄存器的状态都可能在任何时刻发生变化，因此，避免不必要的硬件中断可以确保操作系统的稳定性和正确性。同时，在引导过程结束后，操作系统可以选择启用硬件中断，以便正常运行。

方向标志是 CPU 中的一个标志位，用于控制字节操作的方向。在 x86 架构中，当方向标志被设置为 1 时，字节操作从高地址向低地址执行，这称为从高地址到低地址的字节操作。当方向标志被设置为 0 时，字节操作从低地址向高地址执行，这称为从低地址到高地址的字节操作。在操作系统中，设置方向标志可以帮助保证正确的字节顺序。例如，当写入数字的二进制表示时，如果方向标志没有设置正确，那么写入的数字可能不正确。因此，在操作系统的某些代码段中，在操作字节数据时可能需要设置或清除方向标志。

在一些特定情况下，不可屏蔽中断 (NMI) 可能会干扰系统正常运行，例如当系统正在进行一些关键操作时。关闭不可屏蔽中断可以确保系统在执行关键操作时不会被打断，从而避免对系统造成影响。

启动 A20 地址线。打开保护模式并进入保护模式。

IDT 和 GDT 是两个在 x86 架构中常用的描述符表。IDT (Interrupt Descriptor Table) 是一个中断描述符表，它描述了各种硬件和软件中断的行为，包括处理方式和中断处理程序的地址。当硬件或软件中断发生时，CPU 会转到 IDT 中的相应描述符，执行相应的中断处理程序。GDT (Global Descriptor Table) 是一个全局描述符表，它描述了系统中各个代码段和数据段的性质，如大小、访问权限、执行属性等。GDT 的作用是提供给段寄存器选择段，并在进行内存访问时对内存访问进行限制。


整个代码的目的是为了启动操作系统并将控制权转移到保护模式，以便进一步加载操作系统的其他部分。

[f000:fff0]    0xffff0: ljmp   $0xf000,$0xe05b      # 该指令是一条长跳（ljmp）指令，跳转到 `$0xfe05b` 处，用于将控制权转移到内存的不同位置
[f000:e05b]    0xfe05b: cmpl   $0x0,%cs:0x6ac8      # 若 0x6ac8 处的值为零则跳转
[f000:e062]    0xfe062: jne    0xfd2e1
[f000:e066]    0xfe066: xor    %dx,%dx              # 将 dx 寄存器清零
[f000:e068]    0xfe068: mov    %dx,%ss              # 将 ss 寄存器清零
[f000:e06a]    0xfe06a: mov    $0x7000,%esp         # esp = 0x7000 esp 始终指向栈顶
[f000:e070]    0xfe070: mov    $0xf34c2,%edx        # edx = 0xf34c2 
[f000:e076]    0xfe076: jmp    0xfd15c              # 跳转到 0xfd15c
[f000:d15c]    0xfd15c: mov    %eax,%ecx            # ecx = eax
[f000:d15f]    0xfd15f: cli                         # 关闭硬件中断
[f000:d160]    0xfd160: cld                         # 设置了方向标志，表示后续操作的内存变化
[f000:d161]    0xfd161: mov    $0x8f,%eax           # eax = 0x8f  接下来的三条指令用于关闭不可屏蔽中断
[f000:d167]    0xfd167: out    %al,$0x70            # 0x70 和 0x71 是用于操作 CMOS 的端口
[f000:d169]    0xfd169: in     $0x71,%al            # 从CMOS读取选择的寄存器
[f000:d16b]    0xfd16b: in     $0x92,%al            # 读取系统控制端口A
[f000:d16d]    0xfd16d: or     $0x2,%al         
[f000:d16f]    0xfd16f: out    %al,$0x92            # 启动 A20
[f000:d171]    0xfd171: lidtw  %cs:0x6ab8           # 加载到 IDT 表
[f000:d177]    0xfd177: lgdtw  %cs:0x6a74           # 加载到 GDT 表
[f000:d17d]    0xfd17d: mov    %cr0,%eax            # eax = cr0
[f000:d180]    0xfd180: or     $0x1,%eax            # 
[f000:d184]    0xfd184: mov    %eax,%cr0            # 打开保护模式
[f000:d187]    0xfd187: ljmpl  $0x8,$0xfd18f        # 通过 ljmp 进入保护模式
=> 0xfd18f:     mov    $0x10,%eax                   # 设置段寄存器
=> 0xfd194:     mov    %eax,%ds
=> 0xfd196:     mov    %eax,%es
:::    

当 BIOS 启动的时候会先设置中断描述表，然后初始化各种硬件，例如 VGA 。

当初始化 PCI 总线和 BIOS 知晓的所有重要设备后，将会寻找一个可启动的设备，如软盘、硬盘或 CD-ROM 。

最终，当找到一个可启动的磁盘时，BIOS 从磁盘上读取 boot loader 并将控制权转移给它。

## Part 1 总结

PC 通电后，CPU 首先执行 BIOS ，从 `0xffff0` 开始执行指令，做一些初始化工作例如关闭中断，不可屏蔽中断。接下来开启 A20 地址线，然后进入保护模式。








# Lab 1 Part 2: The Boot Loader

磁盘是由扇区组成，一个扇区为 512 B。磁盘的第一个扇区称为 boot sector ，其中存放着 boot loader 。

BIOS 将 512B 的 boot sector 从磁盘加载到内存 0x7c00 到 0x7dff 之间。然后使用 jmp 指令设置 CS:IP 为 0000:7c00 最后将控制权传递给引导装载程序。JOS 使用传统的硬盘启动机制，也就是 boot loader 不能超过 512B 。当 BIOS 找到一个可以启动的磁盘以后就会把这 512 字节的扇区加载到 0x7c00 到 0x7dff 中。

> 为什么是 0x7c00？
> 简而言之，0x7c00 = 32KB - 1024B  
> 最初 IBM 设计 DOS 1.0 最小内存是 32KB 。
> 为了加载 boot loader 所消耗的内存要大于 512B ，选择了 1024B 。

boot loader 由汇编语言 `boot/boot.S` 和一个 C 语言文件 `boot/main.c` 组成。需要搞明白这两个文件的内容。

Boot Loader 负责两个功能：

1. boot loader 从实模式切换到 32 位的保护模式，因为只有在保护模式下软件才能访问超过 1MB 的物理内存。此外在保护模式下，段偏移量就变为了 32 而非 16 。

2. 其次，Boot Loader 通过 x86 的特殊 I/O 指令直接访问 IDE 磁盘设备寄存器，从硬盘上读取内核。

理解了 Boot Loader 的源代码后，看看 `obj/boot/boot.asm` 文件。这个文件是 GNUmakefile 在编译 Boot Loader 后创建的 Boot Loader 的反汇编。这个反汇编文件使我们很容易看到 Boot Loader 的所有代码在物理内存中的位置，也使我们更容易在 GDB 中跟踪 Boot Loader 发生了什么。同样的，`obj/kern/kernel.asm` 包含了 JOS 内核的反汇编，这对调试很有用。

在 gdb 中使用 b *0x7c00 在该地址处设置断点，然后使用 c 或 si 继续执行。c 将会跳转到下一个断点处，而 si 跳转到下一条指令，si N 则一次跳转 N 条指令。

使用 `x/Ni ADDR` 来打印地址中存储的内容。其中 N 是要反汇编的连续指令的数量，ADDR 是开始反汇编的内存地址。

> Exercise 3.
> 
> Exercise 3. 阅读 [lab tools guide](https://pdos.csail.mit.edu/6.828/2018/labguide.html)，即使你已经很熟悉了，最好看看。
> 
> 在 0x7c00 设置一个断点，启动扇区将会加载到此处。跟踪 `boot/boot.S` 并使用 `obj/boot/boot.asm` 来定位当前执行位置。使用 GDB 的 x/i 命令来反汇编 Boot Loader 中的指令序列并和 `obj/boot/boot.asm` 比较。
> 
> 跟踪 boot/main.c 中的 bootmain() 函数，此后追踪到 readsect() 并研究对应的汇编指令，然后返回到 bootmain() 。确定从磁盘上读取内核剩余扇区的for循环的开始和结束。找出循环结束后将运行的代码，在那里设置一个断点，并继续到该断点。然后逐步完成 Boot Loader 的剩余部分。

0x7c00 是 boot loader 的起始地址，

* 阅读 `obj/boot/boot.asm` 下面是一些总结：

在汇编中以 . 开头的是汇编器指令，功能是告诉汇编器如何做，而不是做什么。汇编器指令并不会直接翻译为机器码，汇编指令会直接翻译为机器码。首先设置实模式的标志，进入实模式。然后关闭中断，防止执行时被打断，接下来设置字符串指针的移动方向。做了一些初始化工作，例如寄存器清零，开启 A20 数据线，为切换到 32 位做准备。处理 GDT 。

* 回答下面的问题：

1. 在什么时候，处理器开始执行32位代码？究竟是什么原因导致从16位到32位模式的转换？

从 boot.S 的第 55 行开始切换为 32 位代码，切换到 32 位后会有更多的寻址空间。

2. Boot Loader 执行的最后一条指令是什么，它刚刚加载的内核的第一条指令是什么？

最后一条指令是 `boot/main.c` 的 `((void (*)(void)) (ELFHDR->e_entry))();`  `movw $0x1234, 0x472`

将内核ELF文件载入内存后，调用内核入口点

3. 内核的第一条指令在哪里？

内核的第一条指令在 0x1000c 处，对应的源码位于 kern/entry.S 中。

4. Boot Loader 如何决定它必须读取多少个扇区才能从磁盘上获取整个内核？它在哪里找到这些信息？

这些信息存放在 Proghdr 中。

接下来进一步研究 `boot/main.c` 中的 C 语言部分。

> Exercise 4. 
> 
> 建议阅读 'K&R' 5.1 到 5.5 搞清楚指针，此外弄清楚 [pointers.c](https://pdos.csail.mit.edu/6.828/2018/labs/lab1/pointers.c) 的输出，否则后续会很痛苦。

需要了解 ELF 二进制文件才能搞清楚 `boot/main.c` 。

当编译链接一个 C 语言程序时，首先需要将 .c 文件编译为 .o 结尾的 object 文件，其中包含了相应的二进制格式的汇编指令。

链接器将所有的 .o 文件链接为单个二进制镜像，例如 `obj/kern/kernel` ，这是一个 ELF 格式的二进制文件，全称叫做 “Executable and Linkable Format” 。

此处可以简单的将 ELF 认为该文件头部带有加载信息，然后是是程序部分，每部分都是连续的代码或数据块，将指定的地址加载到内存中。Boot Loader 将其加载到内存中并开始执行。

ELF 的二进制文件头部的长度是固定的，然后是长度可变的程序头，其中包含了需要加载的程序部分。在 `inc/elf.h` 中包含了 ELF 文件头部的定义。

* .text: 程序指令.
* .rodata: 只读数据，例如由 C 编译器生成的 ASCII 字符常量。(这个只读并没有在硬件层面实现)
* .data: 数据部分，包含了程序初始化的数据，例如声明的全局变量 x = 5 。

当链接器计算一个程序的内存布局之时，它为没有初始化的程序保留了空间，例如 int x ，在内存中紧随.data之后的一个名为.bss的部分。C 默认未初始化的全局变量为零，所以 .bss 此时没有存储内容，因此链接器只记录 .bss 部分的地址和大小并将其置为零。

通过键入检查内核可执行文件中所有部分的名称、大小和链接地址的完整列表。

    $ objdump -h obj/kern/kernel

    obj/kern/kernel:     file format elf32-i386

    Sections:
    Idx Name          Size      VMA       LMA       File off  Algn
    0 .text         00001917  f0100000  00100000  00001000  2**4
                    CONTENTS, ALLOC, LOAD, READONLY, CODE
    1 .rodata       00000714  f0101920  00101920  00002920  2**5
                    CONTENTS, ALLOC, LOAD, READONLY, DATA
    2 .stab         00003889  f0102034  00102034  00003034  2**2
                    CONTENTS, ALLOC, LOAD, READONLY, DATA
    3 .stabstr      000018af  f01058bd  001058bd  000068bd  2**0
                    CONTENTS, ALLOC, LOAD, READONLY, DATA
    4 .data         0000a300  f0108000  00108000  00009000  2**12
                    CONTENTS, ALLOC, LOAD, DATA
    5 .bss          00000648  f0112300  00112300  00013300  2**5
                    CONTENTS, ALLOC, LOAD, DATA
    6 .comment      00000023  00000000  00000000  00013948  2**0
                    CONTENTS, READONLY

VMA 是逻辑地址，LMA 是加载到内存中的物理地址。通常这两个地址是相同的。

boot loader 根据 ELF 文件的头部决定加载哪些部分。程序头部指定了哪些信息需要加载及其地址。可以通过下面的命令来查看程序头部。

    athena% objdump -x obj/kern/kernel

程序头部已经在 "Program Headers" 下列出，ELF 对象的区域需要加载到内存中然后被标记为 "LOAD"。

每个程序头的其他信息也被给出，如虚拟地址（"vaddr"），物理地址（"paddr"），以及加载区域的大小（"memsz "和 "filesz"）。

回到 `boot/main.c` 每一个程序的 `ph->p_pa` 字段包含了段的物理地址。此处是一个真正的物理地址，尽管 ELF 对这个描述不清晰。

BIOS 将 boot sector 加载到内存中并从 0x7c00 处开始，这是 boot sector 的加载地址。boot sector 从这里开始执行。这也是 boot sector 执行的地方，所以这也是它的链接地址。

在 `boot/Makefrag` 中通过 -Ttext 0x7C00 设置了启动地址。

> Exercise 5.再次追踪 Boot Loader 的前几条指令，找出第一条指令，如果把 Boot Loader 的链接地址弄错了，就会 "中断 "或报错。然后把`boot/Makefrag` 中的链接地址改成错误的，运行 make clean，用make重新编译实验室，并再次追踪到 boot loader，看看会发生什么。不要忘了把链接地址改回来，然后再做一次清理。

修改 `boot/Makefrag` 中的 `-Ttext 0x7C00` ，查看结果，例如将 其改为 `-Ttext 0x0C00` 。起初依旧加载到 0x7c00 处，但是跳转的时候出现问题。也就是最初的指令并不依赖地址，跳转的时候依赖。

![20220505143831](https://cdn.jsdelivr.net/gh/weijiew/pic/images/20220505143831.png)

回头看内核加载和链接的地址，和 Boot Loader 不同的是，这两个地址并不相同。内核告诉 Boot Loader 在一个低的地址（1 兆字节）将其加载到内存中，但它希望从一个高的地址执行。我们将在下一节中深入探讨如何使这一工作。

此外 ELF 还有很多重要的信息。例如 e_entry 是程序 entry point 的地址。可以通过如下命令查看：

    $ objdump -f obj/kern/kernel

    obj/kern/kernel:     file format elf32-i386
    architecture: i386, flags 0x00000112:
    EXEC_P, HAS_SYMS, D_PAGED
    start address 0x0010000c

kernel 是从 0x0010000c 处开始执行。

此时应当理解 `boot/main.c` 中的 ELF loader 。它将内核的每个部分从磁盘上读到内存中的该部分的加载地址，然后跳转到内核的入口点。

> Exercise 6.可以使用 GDB 的 x 命令来查看内存。此处知晓 `x/Nx ADDR` 就够用了，在ADDR处打印N个字的内存。

重新打开 gdb 检测，在 BIOS 进入 Boot Loader 时检查 0x00100000 处的 8 个内存字，然后在 Boot Loader 进入内核时再次检查。为什么它们会不同？在第二个断点处有什么？(你不需要用 QEMU 来回答这个问题，只需要思考一下。)

> 不同是因为内核加载进来了，内核指令。

## Part 2 总结

CPU 执行完成 Qemu 中预先设定的 BIOS 代码（将磁盘第一个扇区的数据(512B)复制到内存 0x7c00 到 0x7dff 之间，即 boot.S 和 bootmain.c 统称为 boot loader ）后会跳转到 0x7c00 。


    +------------------+  <- 0x00100000 (1MB)
    |                  |  
    |     BIOS ROM     |  <- 0x000ffff0 🎯 1. 将第一个扇区从磁盘读到 0x7c00 
    |                  | 
    +------------------+  <- 0x000F0000 (960KB)
    |  16-bit devices, |
    |  expansion ROMs  |    
    +------------------+  <- 0x000C0000 (768KB)
    |   VGA Display    | 
    +------------------+  <- 0x000A0000 (640KB) IOPHYSMEM
    |                  |  
    |    Low Memory    |  <- 0x000x7c00 🔍 2. 转为 32 位，将内核写到 0x10000
    |                  |  
    |                  |  <- 0x00010000 🔎 3. 执行内核
    |                  |  
    +------------------+  <- 0x00000000

1. 读取第一个扇区，将 boot.S 和 bootmain 读取到 0x7c00 处。
2. 执行 boot.S 和 bootmain 
   1. boot.S 设置了保护模式和一个堆栈，以便 C 代码可以运行，然后调用 bootmain()。
   2. bootmain 读入内核并跳转到它。
3. 执行内核，Part 3 将会继续研究。







# Lab 1 Part 3: The Kernel

最初先执行汇编，然后为 C 语言执行做一些准备。使用虚拟内存来解决位置依赖的问题。

Boot Loader 的虚拟地址和物理地址相同，但是内核的虚拟地址和物理地址不同，更为复杂，链接和加载地址都在 `kern/kernel.ld` 的顶部。

地址空间的低地址部分通常留给用户程序使用。高地址部分通常留给 OS 内核使用，链接和运行，例如 `0xf0100000` 。

但是有些机器的物理内存（物理内存太小）无法达到 `0xf0100000` 进而无法存储内核。解决方案是使用内存管理硬件将虚拟地址 `0xf0100000` 映射到物理地址 `0x00100000` 处。这样使得内核虚拟地址足够高，用户进程有足够的地址空间。即一份代码在虚拟内存上映射了两次。

内核实际位于物理内存中位于 PC 中 RAM 的 1MB 处，也就在 BIOS ROM 上方。这使得 PC 至少要有几兆字节的物理内存，至少大于 `0x00100000` 才可以。这也是 1990 年后的 PC 真实情况。

事实上，在下一个实验中，我们将把PC的整个底部 256MB 的物理地址空间，从物理地址 `0x00000000` 到 `0x0fffffff` ，分别映射到虚拟地址 `0xf0000000` 到 `0xffffffff` 。这也就是为什么JOS只能使用前256MB的物理内存了。

现在只需映射前 4MB 的物理内存，这就足以开始运行。

使用`kern/entrypgdir.c`中手工编写的、静态初始化的页目录和页表来做这件事。现在不需要了解这个工作的细节，只需要了解它的效果。在`kern/entry.S`设置 CR0_PG 标志之前，内存引用被视为物理地址（严格来说，它们是线性地址，但`boot/boot.S`设置了从线性地址到物理地址的映射，我们永远不会改变）。一旦 CR0_PG 被设置，内存引用就是虚拟地址，被虚拟内存硬件翻译成物理地址。 entry_pgdir 将 0xf0000000 到 0xf0400000 范围内的虚拟地址翻译成物理地址 0x00000000 到 0x00400000 ，以及虚拟地址0x00000000到0x00400000翻译为物理地址0x00000000到0x00400000。任何不在这两个范围内的虚拟地址都会引起硬件异常，由于我们还没有设置中断处理，这将导致QEMU转储机器状态并退出（如果你没有使用6.828补丁版本的QEMU，则会无休止地重新启动）。

> Exercise 7.
> 
> 使用QEMU和GDB追踪到JOS的内核，在 `movl %eax, %cr0` 处停止。检查0x00100000和0xf0100000处的内存。现在，使用stepi GDB命令对该指令进行单步操作。再次，检查0x00100000和0xf0100000处的内存。确保你明白刚刚发生了什么。

在新的映射建立后的第一条指令是什么，如果映射没有建立，它将不能正常工作？把`kern/entry.S`中的`movl %eax, %cr0`注释，追踪到它，看看你是否正确。

![20220505155904](https://cdn.jsdelivr.net/gh/weijiew/pic/images/20220505155904.png)

在 0x00100000 处打断点，比较两个地址中存储的数据后发现不一样。

![20220505160121](https://cdn.jsdelivr.net/gh/weijiew/pic/images/20220505160121.png)

> 然后执行几条指令，执行完 `mov    %eax,%cr0` 后发现两个地址中存储的数据一致。说明此时启用了页表明完成了地址映射。

大多数人认为 printf() 这样的函数是理所当然的，有时甚至认为它们是C语言的 "原语"。但是在操作系统的内核中，我们必须自己实现所有的I/O。

## Formatted Printing to the Console

阅读 `kern/printf.c`、`lib/printfmt.c` 和 `kern/console.c`，并确保你理解它们之间的关系。在后面的实验中会清楚为什么 `printfmt.c` 位于单独的 lib 目录中。

`kern/printf.c` 中的 `cprintf()` 函数调用了 `vcprintf()` 函数，该函数又调用了 `lib/printfmt.c` 中的 `vprintfmt()` 函数。

	va_start(ap, fmt);
	cnt = vcprintf(fmt, ap);
	va_end(ap);

接下来研究 `cprintf()` 函数，函数签名是 `int cprintf(const char *fmt, ...)` 其中 ... 表示可变参数。

然后是 [va_start](https://en.cppreference.com/w/c/variadic/va_start) ，简单来说，就是将可变参数放置到 ap 中。

然后调用 vcprintf 函数，将得到的参数 ap 传进去，最后调用 `va_end` 释放参数列表。此外，这部分还涉及到了 va_arg ，后面会用到，例如 `va_arg(*ap, int)` 表示用 int 来解析 ap 。

其中 putch 函数作为参数传入，而 putch 函数调用了 cputchar 函数，该函数再次调用了 cons_putc 函数，根据注释可知该函数负责将字符输出到终端。根据调用关系，可以简单的认为 putch 实现了将数据打印到终端的功能，至于实现细节后续再研究。

接下来回头研究 `lib/printfmt.c` 中的 `vprintfmt()` 函数，因为 `kern/printf.c` 中的 `cprintf()` 最终调用了该函数。

```c
vprintfmt(void (*putch)(int, void*), void *putdat, const char *fmt, va_list ap)
```

该函数的函数签名中共四个参数，下面是四个参数的解释：

1. 第一个参数是 putch 函数，之前已经解释过了，负责实现打印到终端。
2. 第二个参数 putdat 初始值为零，目前还不知道负责什么功能。
3. 第三个参数 fmt 是输入的字符串。
4. 第四个参数 ap 是 va_list 类型，这个参数实现了可变参数，也就是可以处理不同数量的参数。

cons_putc 分别调用了 serial_putc，lpt_putc 和 cga_putc 三个函数。

> Exercise 8. 省略了一小段代码--使用"%o "形式的模式打印八进制数字所需的代码。找到并填入这个代码片段。
> 
> 这个很简单，研究上下文就能搞定。

回答以下问题: 

1. 解释一下 printf.c 和 console.c 之间的接口。具体来说，console.c 输出了什么函数？这个函数是如何被printf.c使用的？

printf.c 中的 putch() 函数调用了 console.c 中的 cputchar() 函数，该函数再次调用了 cons_putc() 函数，这个函数负责将数据打印到终端。

2. 从 console.c 中解释如下：

```c
    1      if (crt_pos >= CRT_SIZE) {
    2              int i;
    3              memmove(crt_buf, crt_buf + CRT_COLS, (CRT_SIZE - CRT_COLS) * sizeof(uint16_t));
    4              for (i = CRT_SIZE - CRT_COLS; i < CRT_SIZE; i++)
    5                      crt_buf[i] = 0x0700 | ' ';
    6              crt_pos -= CRT_COLS;
    7      }
```

这段函数源自 `console.c` 文件中的 `cga_putc()` 函数，该函数会被 `cons_putc()` 函数所调用。根据注释可知，`cons_putc()` 负责将数据打印到终端，那么 `cga_putc()` 则是负责具体实现如何打印到终端。

然后研究 `void* memmove( void* dest, const void* src, std::size_t count );` 从 src 处复制 count 大小的数据到 dest 上。最后分析 `memmove(crt_buf, crt_buf + CRT_COLS, (CRT_SIZE - CRT_COLS) * sizeof(uint16_t));` 其实就是将当前屏幕上的数据向上移动一行。

最后的 for 循环就是将最新写入的部分(crt_pos >= CRT_SIZE)打印出来。

3. 对于下面的问题，你可能希望参考第2讲的注释。这些笔记涵盖了GCC在X86上的调用惯例。

* 逐步跟踪以下代码的执行。

    int x = 1, y = 3, z = 4;
    cprintf("x %d, y %x, z %d\n", x, y, z);

* 在对cprintf()的调用中，fmt指向什么？ap指的是什么？

列出对cons_putc、va_arg和vcprintf的每个调用（按执行顺序）。对于cons_putc，也要列出其参数。对于va_arg，列出调用前后ap所指向的内容。对于vcprintf，列出其两个参数的值。


> 首先研究 fmt ：将上述代码写入 `kern/monitor.c` 中的 `mon_backtrace()` 函数中，然后开始调试。

> 使用 `b mon_backtrace` 打断点，使用 c 执行到这一步，然后使用 `s` 进入 `cprintf()` 函数中，多执行两步后发现 `fmt = "x %d, y %x, z %d\n"` 。

![20220505225217](https://cdn.jsdelivr.net/gh/weijiew/pic/images/20220505225217.png)

> 接下来研究 ap ，经过数次调用 va_arg ，ap 从 1 3 4 变为 3 4 变为 4 再为空。

4. 运行以下代码。

    unsigned int i = 0x00646c72;
    cprintf("H%x Wo%s", 57616, &i);


输出是什么？解释一下这个输出是如何按照前面练习的方式一步步得出的。这里有一个ASCII表，将字节映射到字符。这个输出取决于x86是小端的事实。如果x86是big-endian的，你要把i设置成什么样子才能产生同样的输出？你是否需要将57616改为不同的值？

> 输出 "He110 World" 其中 5760 的二进制形式是 e110 。至于 0x00646c72 为什么显示为 rld ，首先要搞清楚大小端。

> 我认为应当从读取顺序的角度来看，通常人类的读取习惯是从高位向地位阅读，也就是从左向右。但是对于计算机而言优先处理地位显然效率更高，所以数字的地位存储在低地址部分，数据的高位存储在高地址部分，也就是小端。而大端反之，地位存储在高地址部分，小端存储在低地址部分。

    低地址  =====> 高地址
    小端：  72  6c  64 00
    大端：  00  64  6c 72

> 查 ASCII 表可知 0x72 0x6c 0x64 0x00 分别表示 'r' 'l' 'd' '\0' 。如果在大端的系统上输出相同的内容需要改为 0x726c6400 。

5. 在下面的代码中，'y='后面要打印什么？(注意：答案不是一个具体的数值。)为什么会出现这种情况？

    cprintf("x=%d y=%d", 3);

> 输出 x=3 y=-267321544 第一个输出 3 是因为参数就是 3 而第二个输出则是读取了相邻地址中的内容。

6. 假设GCC改变了它的调用惯例，使它按声明顺序把参数推到堆栈上，这样最后一个参数就被推到了。你要如何改变cprintf或它的接口，使它仍然有可能传递可变数量的参数？

> `cprintf` 函数的两个参数交换顺序即可。

> 挑战，终端打印出彩色文本。跳过

## The Stack

> Exercise 9.  
> 
> 确定内核在哪里初始化它的堆栈，以及它的堆栈在内存中的确切位置。内核是如何为其堆栈保留空间的？堆栈指针被初始化为指向这个保留区域的哪个 "末端"？

esp 寄存器指向栈顶，ebp 指向栈底。在 32 位模式下，堆栈只能容纳 32 位的值，esp 总能被 4 整除。当调用 C 函数之时，首先将 esp 中的值复制到 ebp 中，然后 esp 向下生长开辟空间。可以通过 ebp 指针链来回溯堆栈进而确定函数的调用关系。这个功能很有用，例如一个函数断言失败或 panic ，那么可以通过回溯堆栈来确定出现问题函数。

> 1. 在 `kernel/entry.S` 中的 `movl	$(bootstacktop),%esp` 指令开始初始化栈，该指令设置了栈帧。
> 2. 根据 `.space		KSTKSIZE` 来确定栈大小，KSTKSIZE 在 `inc/memlayout.h` 定义大小为 8*PGSIZE ，而 PGSIZE 为 4096 字节。
> 3. 根据相应的汇编文件 `obj/kern/kernel.asm` 第 58 行可知，栈帧的虚拟地址为 0xf0110000。因为栈是向下生长，所以根据 KSTKSIZE 可以确定栈的末端。

> Exercise 10. 
> 
> 为了熟悉x86上的C语言调用习惯，在`obj/kern/kernel.asm`中找到`test_backtrace`函数的地址，在那里设置一个断点，并检查内核启动后每次调用该函数时发生的情况。test_backtrace 的每个递归嵌套层在堆栈上推多少个32位字，这些字是什么？

实现 `kern/monitor.c` 文件中的 `mon_backtrace()` 函数。`inc/x86.h`中的`read_ebp()`函数很有用。

回溯函数应该以下列格式显示函数调用框架的清单。

        Stack backtrace:
        ebp f0109e58  eip f0100a62  args 00000001 f0109e80 f0109e98 f0100ed2 00000031
        ebp f0109ed8  eip f01000d6  args 00000000 00000000 f0100058 f0109f28 00000061
        ...

每一行都包含一个 ebp 、 eip 和 args 。
- ebp 值表示该函数所使用的进入堆栈的基本指针：即刚进入函数后堆栈指针的位置，函数序言代码设置了基本指针。 
- eip 值是该函数的返回指令指针：当函数返回时，控制将返回到该指令地址。返回指令指针通常指向调用指令之后的指令（为什么呢）。
- 在args后面列出的五个十六进制值是有关函数的前五个参数，这些参数在函数被调用之前会被推到堆栈中。当然，如果函数被调用时的参数少于5个，那么这5个值就不会全部有用。(为什么回溯代码不能检测到实际有多少个参数？如何才能解决这个限制呢？）

打印的第一行反映当前执行的函数，即 mon_backtrace 本身。第二行反映调用  mon_backtrace 的函数，第三行反映调用该函数的函数，以此类推。应该打印所有未完成的堆栈帧。通过研究 `kern/entry.S` ，你会发现有一种简单的方法可以告诉你何时停止。

以下是你在《K&R》第五章中读到的几个具体要点，值得你在下面的练习和今后的实验中记住。

1. 如果 `int *p = (int*)100`，那么`(int)p + 1`和`(int)(p + 1)`是不同的数字：第一个是101，但第二个是104。当把一个整数加到一个指针上时，就像第二种情况一样，这个整数隐含地乘以指针所指向的对象的大小。
2. `p[i]`被定义为与`*(p+i)`相同，指的是p所指向的内存中的第i个对象。当对象大于一个字节时，上面的加法规则有助于这个定义发挥作用。
3. `&p[i]`与`(p+i)`相同，产生p所指向的内存中的第i个对象的地址。

尽管大多数C语言程序不需要在指针和整数之间进行转换，但操作系统经常需要。每当你看到涉及内存地址的加法时，要问自己这到底是整数加法还是指针加法，并确保被加的值被适当地乘以。

> ebp 的初始值为 0 ，可以判断是否为零来停止循环。

```cpp
	uint32_t ebp, eip;
	cprintf("Stack backtrace:\n");
	for (ebp = read_ebp(); ebp != 0; ebp = *((uint32_t *)ebp)) {
		eip = *((uint32_t *)ebp + 1);
		cprintf(" ebp %08x eip %08x args %08x %08x %08x %08x %08x\n",
		ebp, eip, *((uint32_t *)ebp + 2),
		*((uint32_t *)ebp + 3), *((uint32_t *)ebp + 4),
		*((uint32_t *)ebp + 5), *((uint32_t *)ebp + 6));
	}
```

> Exercise 11. 使用 make grade 验证。

如果使用 read_ebp()，中间变量可能会被优化掉，进而导致跟踪堆栈信息时看不到完整的堆栈信息。

在这一点上，你的回溯函数应该给你堆栈上导致 mon_backtrace() 被执行的函数调用者的地址。然而，在实践中，你经常想知道这些地址所对应的函数名称。例如，你可能想知道哪些函数可能包含一个导致内核崩溃的错误。

为了帮助你实现这一功能，我们提供了函数 debuginfo_eip()，它在符号表中查找eip并返回该地址的调试信息。这个函数在`kern/kdebug.c`中定义。

在这一点上，你的回溯函数应该给你堆栈上导致 `mon_backtrace()` 被执行的函数调用者的地址。然而，在实践中，你经常想知道这些地址所对应的函数名称。例如，你可能想知道哪些函数可能包含一个导致内核崩溃的错误。

为了帮助你实现这一功能，我们提供了函数 `debuginfo_eip()` ，它在符号表中查找 eip 并返回该地址的调试信息。这个函数在`kern/kdebug.c`中定义。

通过 `debuginfo_eip(addr, &info)` 来查看 eip 中更多的信息，具体功能是将地址 addr 处的内容填入 info 中。如果找到信息就返回零，如果没有查到信息就返回负数，

## Exercise 12. 

修改堆栈回溯函数，为每个 eip 显示函数名、源文件名和与该 eip 对应的行号。

在 debuginfo_eip 中，__STAB_* 来自哪里？这个问题有一个很长的答案；为了帮助你发现答案，这里有一些你可能想做的事情。

* 在kern/kernel.ld文件中查找__STAB_*。
* 运行 objdump -h obj/kern/kernel
* 运行objdump -G obj/kern/kernel
* 运行gcc -pipe -nostdinc -O2 -fno-builtin -I. -MD -Wall -Wno-format -DJOS_KERNEL -gstabs -c -S kern/init.c，并查看init.s。
* 看看bootloader是否在内存中加载符号表作为加载内核二进制的一部分
* 完成 debuginfo_eip 的实现，插入对stab_binsearch的调用，以找到地址的行号。


	stab_binsearch(stabs, &lline, &rline, N_SLINE, addr);
	info->eip_line = lline > rline ? -1 : stabs[rline].n_desc;

在内核监控器中添加一个回溯命令，并扩展你的mon_backtrace的实现，以调用debuginfo_eip并为每个堆栈帧打印一行。

        Stack backtrace:
        ebp f0109e58  eip f0100a62  args 00000001 f0109e80 f0109e98 f0100ed2 00000031
        ebp f0109ed8  eip f01000d6  args 00000000 00000000 f0100058 f0109f28 00000061

    K> backtrace
    Stack backtrace:
    ebp f010ff78  eip f01008ae  args 00000001 f010ff8c 00000000 f0110580 00000000
            kern/monitor.c:143: monitor+106
    ebp f010ffd8  eip f0100193  args 00000000 00001aac 00000660 00000000 00000000
            kern/init.c:49: i386_init+59
    ebp f010fff8  eip f010003d  args 00000000 00000000 0000ffff 10cf9a00 0000ffff
            kern/entry.S:70: <unknown>+0
    K> 

每一行都给出了stack frame 的 eip 文件名和在该文件中的行数，然后是函数的名称和 eip 与函数第一条指令的偏移量（例如，monitor+106表示返回eip比monitor的开头多106字节）。

请确保将文件和函数名单独打印在一行，以避免混淆 grading 脚本。

提示：printf格式的字符串提供了一种简单但不明显的方法来打印非空尾的字符串，如STABS表中的字符串。 printf("%.*s", length, string) 最多能打印出字符串的长度字符。看一下printf手册，了解为什么这样做。

你可能会发现在回溯中缺少一些函数。例如，你可能会看到对monitor()的调用，但没有对runcmd()的调用。这是因为编译器对一些函数的调用进行了内联。其他优化可能导致你看到意外的行数。如果你把GNUMakefile中的-O2去掉，回溯可能会更有意义（但你的内核会运行得更慢）。


```cpp
int
mon_backtrace(int argc, char **argv, struct Trapframe *tf)
{
	uint32_t ebp, eip;
	struct Eipdebuginfo info;
	cprintf("Stack backtrace:\n");
	for (ebp = read_ebp(); ebp != 0; ebp = *((uint32_t *)ebp)) {
		eip = *((uint32_t *)ebp + 1);
		cprintf(" ebp %08x eip %08x args %08x %08x %08x %08x %08x\n",
		ebp, eip, *((uint32_t *)ebp + 2),
		*((uint32_t *)ebp + 3), *((uint32_t *)ebp + 4),
		*((uint32_t *)ebp + 5), *((uint32_t *)ebp + 6));
		if (!debuginfo_eip(eip,&info)) {
			cprintf("%s:%d: %.*s+%d\n",
			info.eip_file, info.eip_line,info.eip_fn_namelen,
			info.eip_fn_name, eip - info.eip_fn_addr);		
		}
	}
	return 0;
}
```

## Part 3 总结

bootmain 最后一行位 elf 入口点，然后进入 entry.S ，接下来再跳转到 i386_init 函数中。

entry.S 中实现了虚拟内存。实模式的虚拟地址等于物理地址，保护模式虚拟地址和物理地址之间存在一个映射关系。

# lab1 总结

1. PC 通电后，CPU 首先执行 BIOS ，执行一些初始化工作。
2. BIOS 将磁盘第一个扇区的数据(512B)复制到内存 0x7c00 到 0x7dff 之间。（这个地址是x86规定的，可自定义）。
3. 这部分数据被称为 boot loader ，负责两个功能：切换到 32 位，将内核加载到内存中。
4. 实模式的虚拟地址等于物理地址，保护模式虚拟地址和物理地址之间存在一个映射关系。






# Lab 2: Memory Management

来源：https://pdos.csail.mit.edu/6.828/2018/labs/lab2/

## 1. 介绍

实现 OS 的内存管理，其中内存管理分为内存分配物理内存和虚拟内存两部分。

- 为内存分配物理内存，内核能够分配并释放内存。分配器以 4096 字节为单位进行分配，也叫做一页。维护一个数据结构，该数据结构记录了哪些物理页被分配，哪些没有被分配，某个被分配的物理页上有多少个进行在共享使用。编写分配和释放内存页的程序。

- 虚拟内存，该部分实现了内核和用户软件使用的虚拟地址到物理地址的映射。当使用内存时，由 x86 中的 MMU 通过查询页表来实现映射。按照提示修改 JOS 中的 MMU 页表使其符合规范。

## 2. Getting started

切换到 lab2 分支然后合并 lab1 代码：

    git checkout -b lab2 origin/lab2
    git merge lab1

下面是切换到 lab2 后新增加的文件，需要浏览一遍。

* inc/memlayout.h
* kern/pmap.c
* kern/pmap.h   
* kern/kclock.h 
* kern/kclock.c

- `memlayout.h` 描述了虚拟地址空间的布局，必须通过修改 `pmap.c` 来实现。

`memlayout.h` 和 `pmap.h` 定义了 `PageInfo` 结构，用它来跟踪哪些物理内存页是空闲的。

PageInfo 是一个结构体，记录了物理页的元信息，和物理页一一对应，可以通过 `page2pa()` 函数实现 PageInfo 和物理页的对应。这个结构体本质上是一个链表，每个节点对应一个物理页并且其中存储了一些关于该物理页的信息，例如该页被引用的次数（ pp_ref 字段）。同时该结构体还有一个指针字段 pp_link ，用于在空闲页列表中链接下一个空闲页。

在 OS 中，通过 PageInfo 组成的链表来跟踪每个物理页的状态，例如是否空闲，是否被占用等。当 OS 想要分配一个物理页时就可以从一个 PageInfo 所维护的空闲链表中选择一个合适的物理页并将其分配给所需要使用该页的进程。此外也可以通过此链表来判断是否可以回收物理页，并更新其中信息。

需要注意的是，该结构体的权限设置为对内核可读写，对用户程序只读，因为该结构体存储的是敏感信息，仅由操作系统内核可以访问和修改。

- `kclock.c` 和 `kclock.h` 操纵 PC 的电池支持的时钟和 CMOS RAM 硬件，其中 BIOS 记录了 PC 包含的物理内存的数量。

- `pmap.c` 中的代码需要读取这个设备硬件，以便计算出有多少物理内存。但这部分代码已经为完成了，不需要知道CMOS硬件工作的细节。

- 注意阅读 `memlayout.h` 和 `pmap.h` ，因为本实验要求你使用并理解它们所包含的许多定义。 

* `inc/mmu.h` 也包含了许多对本实验有用的定义。

在 Lab1 中已经完成了 16 位到 32 位的转换。实现了将 0xf0000000 - 0xf0400000 之间的虚拟地址映射到物理地址 0x00000000 - 00400000 上。

接下来仔细研究 `memlayout.h` 。

![20220515200905](https://cdn.jsdelivr.net/gh/weijiew/pic/images/20220515200905.png)

## Part 1: Physical Page Management

操作系统必须跟踪物理 RAM 的哪些部分是空闲的，哪些是当前正在使用的。JOS 用页的粒度来管理 PC 的物理内存，这样它就可以使用 MMU 来映射和保护每一块分配的内存。

你现在要编写物理页分配器。它通过一个 PageInfo 对象的链接列表来跟踪哪些页面是空闲的（与 xv6 不同的是，这些对象并没有嵌入到空闲页面本身），每个页面都对应一个物理页面。你需要在编写其余的虚拟内存实现之前编写物理页分配器，因为你的页表管理代码将需要分配物理内存来存储页表。

> Exercise 1.  实现 `kern/pmap.c` 中的 `boot_alloc()`, `mem_init()` （只到调用 check_page_free_list(1) 为止）, `page_init()`, `page_alloc()`, `page_free()` 。建议按顺序来。

`check_page_free_list()` 和 `check_page_alloc()` 用来测试物理页分配器。

启动 `check_page_alloc()` ，验证代码代码是否正确，可以添加自己的 assert() 。

启动内核后会先调用 `init.c` 中的 `i386_init()` 。该函数中首先做初始化工作，也就是将 `edata` 到 `end` 之间的数据清零，接下来初始化终端然后就可以使用 `cprintf` 最后调用 `mem_init()` 初始化内存。

在 `mem_init()` 函数中，首先检测通过 `i386_detect_memory()` 当前机器内存数量 。然后通过 `boot_alloc()` 函数创建初始页目录并初始化为 0 。

0. 怎么执行到这个这一步的？

回顾一下：

* `boot.S` 和 `main.c`  组成了 boot loader 。
* 此后文件 `entry.S` 实现了进入内核。
* 随即跳转到 `kern/init.c:i386_init()`，初始化 BSS 数据，初始化终端，最后初始化内存。最终进入`kern/monitor.c:monitor()`。
* 通过 `mem_init()` 函数初始化内存。设置二级页表，kern_pgdir 是根部的线性地址，仅用来设置内核部分地址空间(addresses >= UTOP),
* `kern/monitor.c:monitor()` 负责处理输入命令。

1. 实现 `boot_alloc(n)`

阅读注释可知：这个函数只用于 JOS 设置虚拟内存。page_alloc() 是真正的内存分配器。

如果 `n > 0` ，分配足够的连续物理内存页以容纳'n'字节。 不对内存进行初始化。返回一个内核虚拟地址。

如果 `n == 0` ，返回下一个空闲页的地址，不分配任何东西。

如果内存不够该函数会 panic 。这个函数只能在初始化过程中使用，在page_free_list列表被设置好之前。

`ROUNDUP(a, PGSIZE)` 表示对地址 a 以 PGSIZE 为单位，向上取整。

```cpp
	if (n == 0) return nextfree;
	if (n > 0) {
		result = nextfree;
		nextfree = ROUNDUP((char *) (nextfree + n), PGSIZE);
	}
	if((uint32_t)nextfree - KERNBASE > (npages * PGSIZE)) {
		panic("boot alloc: out of memory.\n");
	}
	return result;
```

此后初始化内核页表 kern_pgdir 。

```cpp
	kern_pgdir = (pde_t *) boot_alloc(PGSIZE);
	memset(kern_pgdir, 0, PGSIZE);
	kern_pgdir[PDX(UVPT)] = PADDR(kern_pgdir) | PTE_U | PTE_P;
```

建立内核页表虚拟地址和物理地址之间的映射。其中 UVPT 是某段虚拟地址的起始地址。PDX 实现了虚拟地址到页表索引的转换。

PADDR 实现了虚拟地址和物理地址之间的映射，地址应当大于等于 KERNBASE ，否则会 panic 。用户和内核的权限是只读。

2. 实现 `mem_init()`

分配 n 个 PageInfo 并指向 pages 。内核使用 pages 来跟踪物理页，每一个物理页和 PageInfo 相对应。

npages 是内核中物理页的数量，使用 memset 将 PageInfo 初始化为零。

此前已经通过 `i386_detect_memory()` 计算出 npages 。

```cpp
	pages = (struct PageInfo *) boot_alloc(sizeof(struct PageInfo) * npages);
	memset(pages, 0, sizeof(struct PageInfo) * npages);
```

3. 实现 `page_init()` 。

此时已经分配好内核的数据结构了，接下来设置自由物理页。一旦设置好后就能使用 `boot_map_region()` 和 `page_insert()` 。

跟踪物理页，pages 中每一个物理页都对应一个 PageInfo 。空闲页存于一个链表中(page_free_list)。

初始化页表结构和内存空闲页。完成后不再使用 `boot_alloc()` 函数，只使用 page allocator 函数，通过`page_free_list` 分配和删除物理内存。

其实就是用头插法构建将物理页转为链表，第零个物理页标记被使用。 base memory (前 640KB) 全当作空闲链表处理，此后是一个 I/O hole 设置标记不能使用，其余内存都塞入空闲链表中。

```c

	// 1) page 0 被使用，保留实模式下的 IDT 和 BIOS 结构
	pages[0].pp_ref = 1;

	// 头插法构建空闲链表
	size_t i;
	for (i = 1; i < npages_basemem; i++) {
		pages[i].pp_ref = 0;
		pages[i].pp_link = page_free_list;
		page_free_list = &pages[i];		
	}

	// 分为三部分：
	// 1. npages_basemem 是偏移量。
	// 2. 380K/4K = 96 用于 IO hole。
	// 3. 用于映射初始页表。
	const size_t pages_in_use_end = 
	npages_basemem + 96 + ((uint32_t)boot_alloc(0) - KERNBASE) / PGSIZE;	

	//  [IOPHYSMEM, EXTPHYSMEM)
	for (i = npages_basemem; i < pages_in_use_end; i++){
		pages[i].pp_ref = 1;
	}

	for (i = pages_in_use_end; i < npages; i++) {
		pages[i].pp_ref = 0;
		pages[i].pp_link = page_free_list;
		page_free_list = &pages[i];
	}
```

4. 实现 `page_alloc()` 。

`page_alloc` 负责分配物理页，

`page2kva` 中通过 `page2pa` 实现了 `struct PageInfo * ` 和物理地址的映射。再通过 `KADDR` 转为虚拟地址。也就是将 page 转为虚拟地址。

其实就是从空闲链表中取出一个节点。

```c
	if (page_free_list == NULL) {
		return NULL;
	}
	struct PageInfo *t = page_free_list;
	page_free_list = t->pp_link;
	t->pp_link = NULL;
	if (alloc_flags && ALLOC_ZERO) {
		memset(page2kva(t), 0, PGSIZE);
	}
	return t;
```

5. 实现 `page_free()` 。

向空闲链表中加入一个节点。

```c
	if(pp->pp_ref != 0) {
		panic("This page is in using! beacuse pp_ref != 0 .");
	}
	if (pp->pp_link != NULL) {
		panic("This page is in using! beacuse pp_link != NULL !");		
	}
	pp->pp_link = page_free_list;
	page_free_list = pp;
```

至此 Part1 搞定！下面的爆粗不用理会，那是下一部分要解决的问题。

	check_page_free_list() succeeded!
	check_page_alloc() succeeded!
	kernel panic at kern/pmap.c:729: assertion failed: page_insert(kern_pgdir, pp1, 0x0, PTE_W) < 0









# Lab2 Part 2: Virtual Memory

需要熟悉 x86 保护模式的内存管理方式，也就是分段和页转换。

* Exercise 2.建议阅读  [Intel 80386 Reference Programmer's Manual](https://pdos.csail.mit.edu/6.828/2018/readings/i386/toc.htm) 第五章和第六章。仔细阅读关于 page translation 和  page-based protection （5.2和6.4）。建议略读关于分段的章节；虽然 JOS 使用分页硬件进行虚拟内存和保护，但分段转换和基于分段的保护在 x86 上不能被禁用，所以需要对它有一个基本的了解。

逻辑地址转为物理地址需要经过分段和分页两部分。

逻辑地址经过分段转为线性地址，线性地址经过分页转为物理地址。

## Virtual, Linear, and Physical Addresses

虚拟地址，线性地址，物理地址。

在 x86 术语中，虚拟地址由段选择子和段内偏移量组成。

在段转换后，页转换前，该地址为线性地址。

经过段转换和页转换后，最终变为物理地址。


           Selector  +--------------+         +-----------+
          ---------->|              |         |           |
                     | Segmentation |         |  Paging   |
Software             |              |-------->|           |---------->  RAM
            Offset   |  Mechanism   |         | Mechanism |
          ---------->|              |         |           |
                     +--------------+         +-----------+
            Virtual                   Linear                Physical


C语言的指针是虚拟地址的偏移部分。

在 `boot/boot.S` 中设置了一个全局描述符表（GDT），据此将所有的段基地址设置为 0 ，限制为`0xffffffff` ，有效地禁止了段转换。因此，"selector" 没有作用，线性地址总是等于虚拟地址的偏移。

在 lab3 中将会与分段进行更多的交互，以设置权限级别。

对于内存转换，可以在整个JOS实验中忽略分段，而只关注页面转换。

在 Lab1 的 part 3 中设置了一个简单的页表，使得内核能够在 `0xf0100000` 处执行，尽管它实际上被加载在物理内存中，就在 ROM BIOS 的上方，位于 `0x00100000` 。该页表仅映射了 4MB 的内存。

在这个 lab 中，将会映射从 `0xf0000000` 处开始的 256 MB 的内存空间，并且映射虚拟地址空间的其他部分。

* Exercise 3. 虽然GDB只能通过虚拟地址访问QEMU的内存，但是在设置虚拟内存的时候能够检查物理内存往往是很有用的。建议回顾 qemu 的命令，尤其是 xp 命令可以查看物理内存。通过 Ctrl-a c 可以查看 QEMU monitor 。
* 使用 QEMU monitor 中的 xp 命令和 GDB 中的 x 命令来检查相应物理地址和虚拟地址的内存，确保看到的数据是一样的。
* 实验中所使用的 QEMU 补丁版本中提供了一个`info pg`命令，该命令显示了一个紧凑但详细的当前页表，包括所有映射的内存范围、权限和标志。
* `info mem` 显示了哪些虚拟地址范围被映射了，有哪些权限。

一旦进入保护模式（在 `boot/boot.S` 中首先进入保护模式），就没有办法直接使用线性或物理地址。所有的内存引用都被解释为虚拟地址并由 MMU 转换，这意味着 C 语言中所有的指针都是虚拟地址。

JOS 内核经常需要将地址作为不透明的值或整数来操作，而不去引用它们。例如在物理内存分配器中，有时这些是虚拟地址，有时是物理地址。为了帮助记录代码，JOS的源代码区分了这两种情况：`uintptr_t` 表示虚拟地址，而 `physaddr_t` 代表物理地址。但实际上二者均是 32 位整数，即 uint32_t 型。二者可以进行类型转换，但是若进行解引用需要转为指针。

总结：

* C type	Address type
* T*  	Virtual
* uintptr_t  	Virtual
* physaddr_t  	Physical

Q: 假设下面的JOS内核代码是正确的，变量 x 应该是什么类型，uintptr_t 还是 physaddr_t ？

    mystery_t x;
    char* value = return_a_pointer();
    *value = 10;
    x = (mystery_t) value;

A: 虚拟地址，因为使用了解引用。

JOS 内核有时需要读取或修改它只知道物理地址的内存。例如，向页表中添加映射可能需要分配物理内存来存储页目录，然后初始化该内存。然而，内核不能绕过虚拟地址转换，因此不能直接加载和存储到物理地址。

JOS 将所有的物理内存从物理地址 0 开始重新映射到虚拟地址 `0xf0000000` 处的原因之一是为了帮助内核读写它只知道物理地址的内存。

物理地址加上 `0xf0000000` 后转为内核虚拟地址，可以通过 `KADDR(pa)` 来实现。

内核虚拟地址减去 `0xf0000000` 后转为物理地址，可以通过 `PADDR(va)` 实现。内核全局变量和由 `boot_alloc()` 分配的内存都在加载内核的区域，从 `0xf0000000` 开始映射所有物理内存的区域。

## Reference counting

后续存在多个虚拟地址指向同一个物理页的情况，这就使得物理页不能被随便释放。通过物理页的 PageInfo 结构的 pp_ref 字段中对每个物理页的引用数量进行统计。当物理页计数为零时该页面可以被释放。

通常该计数等于物理页所在页表中出现在 UTOP 一下的次数。UTOP以上的映射大多是在启动时由内核设置的，不应该被释放，所以没有必要对它们进行引用计数。

此外还将用它来跟踪保留的指向页面目录页面的指针数量，反过来，也跟踪页面目录对页面表页的引用数量。

使用page_alloc时要小心。它返回的页面的引用计数总是为 0 ，所以一旦对返回的页面做修改，pp_ref 就应该被递增（比如把它插入到一个页面表中）。有时这由其他函数处理（例如，page_insert），有时调用page_alloc的函数必须直接处理。

## Page Table Management

实现页表管理方面的一些操作。例如插入、删除线性地址到物理地址的映射，创建页表。

* Exercise 4.  在文件kern/pmap.c中，你必须实现下列函数的代码。

        pgdir_walk()
        boot_map_region()
        page_lookup()
        page_remove()
        page_insert()

check_page()，由 mem_init() 调用，测试页表管理程序。应该确保在继续进行之前报告成功。

回顾一下，执行 `make qemu` 后报错：

  check_page_free_list() succeeded!
  check_page_alloc() succeeded!
  kernel panic at kern/pmap.c:738: assertion failed: page_insert(kern_pgdir, pp1, 0x0, PTE_W) < 0

原因是 `page_insert()` 还未实现，分析可知 `check_page()` 函数调用了 `page_insert()` 。

但是通过阅读 `check_page()` 函数可知，首先测试了 `page_lookup()`，阅读注释可知 `page_lookup()` 需要调用 `pgdir_walk()` 实现。接下来实现 `pgdir_walk()` :

1. 实现 `pgdir_walk()` :

给出一个指向页目录的指针(pgdir)，返回指向线性地址 va 的页表项（PTE）的指针。这需要走两层的页表结构。相关的页表页可能还不存在。

如果页表项不存在并且 `create == false` 那么 `pgdir_walk` 返回 NULL 。否则，pgdir_walk 会用page_alloc 分配一个新的页表页。如果分配失败就返回 NULL，若分配成功那么引用计数加一，页刷新，返回指向页表页的指针。

提示1：你可以用 `kern/pmap.h` 中的 `page2pa()` 将 `PageInfo *` 变成它所指的页面的物理地址。

提示2：x86 MMU 检查 page directory 和 page table 的权限，所以，在 page directory 中留下比严格意义上所需的更多权限是安全的。

提示3：看看`inc/mmu.h`中的有用的宏，这些宏可以操作页表和页指示器条目。

2. 实现 boot_map_region()

```c
static void
boot_map_region(pde_t *pgdir, uintptr_t va, size_t size, physaddr_t pa, int perm)
{
	for(size_t i = 0; i < size; i += PGSIZE, va += PGSIZE, pa += PGSIZE)
	{
		pte_t* addr = pgdir_walk(pgdir, (const void*)va, 1);
		if(addr == NULL) {
			panic("boot_map_region error!");
		}
		*addr = pa | (perm | PTE_P);
	}
}
```


3. 实现 page_lookup()

返回和虚拟地址 va 对应的页面。如果 pte_store 不为零，那么就在其中存储这个页面的 pte 的地址。

```c
struct PageInfo *
page_lookup(pde_t *pgdir, void *va, pte_t **pte_store)
{
	pte_t *pte = pgdir_walk(pgdir, va, 0);
	if (!pte) {
		return NULL;
	}
	if (pte_store) {
		*pte_store = pte;  // 通过指针的指针返回指针给调用者
	}
	if (*pte & PTE_P) {
		return (pa2page(PTE_ADDR(*pte)));
	}
	return NULL;
}
```

4. 实现 page_insert() 

建立物理地址 pp 和 va 之间的映射。PTE 的低 12 位将会被设置为权限 'perm|PTE_P'

```c
int
page_insert(pde_t *pgdir, struct PageInfo *pp, void *va, int perm)
{
	pte_t *pte = pgdir_walk(pgdir, va, 1);

    if (!pte) {
        return -E_NO_MEM;
	}
	if (*pte & PTE_P) {
		if (PTE_ADDR(*pte) == page2pa(pp)) {
			// 插入的是同一个页面，只需要修改权限等即可
			pp->pp_ref--;
		}else {
			page_remove(pgdir, va);
		}
	}
    pp->pp_ref++;
    *pte = page2pa(pp) | perm | PTE_P;
    return 0;
}
```








# Lab2 Part 3: Kernel Address Space

JOS 将 32 位线性地址空间划分为用户和内核两部分，其中用户空间处于地址空间下部，内核处于上部。

`inc/memlayout.h` 中的符号 ULIM 是分界线。内核保留了大约256MB 的虚拟地址空间。这也就是为什么 lab1 中内核有很高的链接地址，因为太低的话下部的用户环境就没有足够的空间了。

`inc/memlayout.h` 中的 JOS 内存布局图对这部分和后面的实验都很有帮助。

## Permissions and Fault Isolation

因为内核和用户都存在于每个环境的地址空间中，所以需要设置权限避免使得用户代码只能访问地址空间的用户部分，否则可能会可能会导致崩溃。请注意，可写权限位（PTE_W）对用户和内核代码都有影响。

用户环境没有 ULIM 以上内存的权限，内核拥有这部分权限。

范围 [UTOP,ULIM] 对于内核和用户环境都是只读，不可写。用来向用户环境访问某些只读的内核数据结构。

最后，UTOP 以下的地址空间是给用户环境使用的；用户环境将为访问这个内存设置权限。

## Initializing the Kernel Address Space

现在可以设置 UTOP 之上的地址空间，地址空间的内核部分。

`inc/memlayout.h` 显示了应当使用的布局。使用刚才写的函数来设置适当的线性到物理的映射关系。

* Exercise 5. 将函数 mem_init() 中 check_page() 后的代码补充完整。通过 check_kern_pgdir() 和 check_page_installed_pgdir() 。 

设置虚拟内存：用户在线性地址 UPAGES 之上映射只读的 "页"。

	boot_map_region(kern_pgdir, UPAGES, PTSIZE, PADDR(pages), PTE_U);

使用 "bootstack" 所指的物理内存作为内核栈。内核堆栈从虚拟地址 KSTACKTOP 开始向下生长。

	boot_map_region(kern_pgdir, KSTACKTOP - KSTKSIZE, KSTKSIZE, PADDR(bootstack), PTE_W);

将虚拟内存 [KERNBASE, 2^32) 映射到 [0, 2^32 - KERNBASE) 上。

	boot_map_region(kern_pgdir, KERNBASE, (0xffffffff-KERNBASE), 0, PTE_W);

测试：

    running JOS: (0.4s)
        Physical page allocator: OK
        Page management: OK
        Kernel page directory: OK
        Page management 2: OK
    Score: 70/70

2. 页面目录中的哪些条目（行）已被填入？它们映射的是什么地址，它们指向哪里？换句话说，尽可能多地填写这个表格。

Entry	Base Virtual Address	Points to (logically):
1023	?	Page table for top 4MB of phys memory
1022	?	?
.	?	?
.	?	?
.	?	?
2	0x00800000	?
1	0x00400000	?
0	0x00000000	[see next question]

3. 将内核和用户环境放在同一个地址空间中。为什么用户程序不能读或写内核的内存？有什么具体的机制来保护内核的内存？

4. 这个操作系统所能支持的最大物理内存量是多少？为什么？

5. 如果我们真的拥有最大数量的物理内存，那么管理内存的空间开销有多大？这种开销是如何分解的？

6. 重新审视 `kern/entry.S` 和 `kern/entrypgdir.c` 中的页表设置。在我们打开分页后，EIP 仍然是一个低数字（略高于1MB）。在什么时候我们要过渡到以高于 KERNBASE 的 EIP 运行？在我们启用分页和开始以高于 KERNBASE 的 EIP 运行之间，是什么使我们有可能继续以低 EIP 执行？为什么这种过渡是必要的？










# Lab 3: User Environments

https://pdos.csail.mit.edu/6.828/2018/labs/lab3/

## Introduction

实现基本的内核功能，例如获取一个进程。

在这个实验中，你将实现让受保护的用户模式环境（即"进程"）运行所需的基本内核设施。

增强JOS内核，以建立数据结构来跟踪用户环境，创建一个单一的用户环境，将一个程序映像加载到其中，并开始运行。将使JOS内核能够处理用户环境的任何系统调用，并处理它引起的任何其他异常。

环境和进程均指运行一个程序的抽象概念。但是 JOS environments 和 UNIX processes 提供了不同的接口。

## Getting Started

切换到 lab3 分支：

    git checkout -b lab3 origin/lab3
    git merge lab2

NANO Ctrl + x 保存。

下面是 lab3 新添加的文件，需要浏览：

* `inc/env.h` 用户环境的公共定义
  * `trap.h` 处理陷阱的公共定义
  * `syscall.h`	从用户环境到内核的公共定义
  * `lib.h` 用户模式支持库的公共定义
* `kern/env.h` 内核专用的对于用户环境定义
  * `env.c` 实现用户模式环境的内核代码
  * `trap.h` 内核专用的陷阱处理定义
  * `trap.c` 陷阱处理代码
  * `trapentry.S` 汇编语言的陷阱处理程序入口点
  * `syscall.h` 内核专用的系统调用的定义
  * `syscall.c` 系统调用的代码实现
* `lib/Makefrag` 构建用户模式的 Makefile 库
  * `entry.S` 用户环境汇编语言的程序入口
  * `libmain.c` 用户模式库设置代码，由 `entry.S` 调用
  * `syscall.c` 用户模式系统调用 stub 函数
  * `console.c` 用户模式实现 putchar 和 getchar，提供终端 I/O
  * `exit.c` 用户模式实现 `exit`
  * `panic.c` 用户模式实现 panic 
* `user/*` lab3 的测试代码

使用 `git diff lab2` 可查看 lab3 对于 lab2 源文件的修改。

## Lab Requirements

Lab 分为 Part A、Part B 两部分。

## Inline Assembly

Lab 中会用到[内联汇编](https://pdos.csail.mit.edu/6.828/2018/reference.html)。

## Part A: User Environments and Exception Handling

`inc/env.h` 包含了 JOS 定义的用户环境。内核使用 `Env` 数据结构来跟踪每一个用户环境。

在这个实验中将会创建一个用户环境，并且 JOS 内核需要支持多用户环境。lab 4 将利用这一特点，允许一个用户环境 fork 其他环境。

在`kern/env.c`中，内核维护着三个与环境有关的主要全局变量。

```cpp
struct Env *envs = NULL;		// 所有的环境
struct Env *curenv = NULL;		// 当前环境光
static struct Env *env_free_list;	// 自由环境列表
```

一旦 JOS 获得并且运行，envs 指针指向了一个 Env 结构的数组来表示环境中的所有环境。

JOS内核将支持最多的 NENV 个同时活动环境。通常运行环境数量是较少的，，NENV 是定义在 `inc/env.h` 中的常量。

一旦被分配，envs 数组将会包含单个 Env 数据结构实例对每个 NENV 环境。JOS 内核将所有不活跃的 Env 结构保存在 env_free_list 中。这种设计使环境的分配和删除变得容易，因为它们只需要被添加到 free list 中或从 free list 中删除。

内核使用 curenv 符号来跟踪当前在任何时间执行的环境。在启动过程中，在第一个环境被运行之前，curenv 最初被设置为 NULL。

## Environment State

Env结构在`inc/env.h`中定义如下（尽管在未来的实验中会增加更多的字段）。

```cpp
struct Env {
	struct Trapframe env_tf;	// 保存的寄存器
	struct Env *env_link;		// 下一个 free Env
	envid_t env_id;			// 环境的唯一标识符
	envid_t env_parent_id;		// 父环境的标识符
	enum EnvType env_type;		// 特殊的系统环境
	unsigned env_status;		// 环境状态
	uint32_t env_runs;		// 环境运行次数

	// 地址空间
	pde_t *env_pgdir;		//  page dir 内核地址空间
};
```

以下是Env字段的用途：

* env_tf: 定义在 `inc/trap.h` 中，当环境不运行时，保存环境寄存器的值。当从用户模式切换到内核模式时，内核会保存这些值方便日后恢复。
* env_link：指向 env_free_list 上的下一个 Env 的链接。env_free_list 指向列表中的第一个free environment。
* env_id: 用来唯一标识当前使用这个Env结构的环境（即，使用 enves 数组中的这个特定槽），存放在内核中。用户环境终止后，内核可以重新分配相同的 Env 结构给一个不同的环境--但是新环境将有一个与旧环境不同的 env_id ，即使新环境重新使用 envs 数组中的同一个槽。
* env_parent_id: 内核存储了创建该环境的环境的 env_id。据此环境之间形成了一个 family tree ，进而可以辅助决策。
* env_type: 用来区分特殊环境的。对于大多数环境，它将是ENV_TYPE_USER。我们将在以后的实验中为特殊的系统服务环境介绍一些更多的类型。
* env_status: 该变量持有以下数值：
  * ENV_FREE: 表明该环境是不活跃的，并且位于 env_free_list 中。
  * ENV_RUNNABLE: 表示Env结构代表一个在处理器上等待运行的环境。
  * ENV_RUNNING: 表示正在运行。
  * ENV_NOT_RUNNABLE: 表示Env结构代表一个当前活动的环境，但它目前还没有准备好运行：例如，因为它正在等待另一个环境的进程间通信（IPC）。
  * ENV_DYING: 表示该Env结构代表一个僵尸环境。一个僵尸环境将在下一次捕获到内核时被释放。在 lab4 之前不使用这个标志。
* env_pgdir: 持有环境页目录的内核虚拟地址。

和 Unix 进程一样，JOS 环境结合了线程和地址空间的概念。线程主要由保存的寄存器（env_tf字段）定义，而地址空间则由env_pgdir所指向的页目录和页表定义。为了运行一个环境，内核必须在CPU上设置保存的寄存器和适当的地址空间。

结构Env类似于xv6中的 struct proc 。这两个结构都在一个 Trapframe 结构中保存了环境（即进程）的用户模式寄存器状态。在JOS中，各个环境并不像 xv6 中的进程那样有自己的内核堆栈。内核中一次只能有一个JOS环境在活动，所以JOS只需要一个内核栈。

## Allocating the Environments Array

在 lab2 中，在 `mem_init()` 中为 `pages[]` 数组分配了内存，这是内核用来跟踪哪些页面是空闲的，哪些不是。现在需要进一步修改 `mem_init()` 来分配一个类似的 Env 结构数组，称为 envs 。

* 练习1. 修改 `kern/pmap.c` 中的 `mem_init()` 来分配和映射 envs 数组。这个数组由环境结构的 NENV实例组成，其分配方式与你分配 pages 数组的方式很相似。和 pages 数组一样，支持 enves 的内存也应该在 UENVS （定义在`inc/memlayout.h`中）处被映射为用户只读，因此用户进程可以从这个数组中读取。通过 check_kern_pgdir() 来判断代码是否正确。

### Exercise 1.

构建 enves 数组，为其申请空间：

	envs = (struct Env*)boot_alloc(NENV*sizeof(struct Env));
	memset(envs, 0, NENV*sizeof(struct Env));

建立映射：

	boot_map_region(kern_pgdir, UENVS, PTSIZE, PADDR(envs), PTE_U);

使用 `make qemu` 验证，通过测试：

    check_page_free_list() succeeded!
    check_page_alloc() succeeded!
    check_page() succeeded!
    check_kern_pgdir() succeeded!
    check_page_free_list() succeeded!
    check_page_installed_pgdir() succeeded!
    kernel panic at kern/env.c:461: env_run not yet implemented
    Welcome to the JOS kernel monitor!
    Type 'help' for a list of commands.
    K>

## Creating and Running Environments

现在你将在 `kern/env.c` 中编写运行用户环境所需的代码。因为目前还没有文件系统，所以设置内核来加载一个嵌入内核本身的静态二进制 image 。JOS 将这个二进制文件作为 ELF 可执行文件嵌入内核中。

Lab 3 GNUmakefile 在 `obj/user/` 目录下生成了一些二进制映像。目录 `kern/Makefrag` 下，二进制文件直接 "链接" 到内核可执行文件中，类似 .o 文件。链接器命令行中的 `-b binary` 选项使这些文件作为 "原始的" 未解释的二进制文件被链接进来，而不是作为由编译器产生的普通 `.o` 文件。(就链接器而言，这些文件根本不一定是 ELF image--它们可以是任何东西，如文本文件或图片！) 在构建内核后查看 `obj/kern/kernel.sym` 会看到链接器 "神奇地 "产生了一些有趣的符号，它们的名字很模糊，比如 _binary_obj_user_hello_start，_binary_obj_user_hello_end，和_binary_obj_user_hello_size。链接器通过篡改二进制文件的文件名来生成这些符号名称；这些符号为普通的内核代码提供了一种引用嵌入式二进制文件的方法。

* Exercise 2. 在文件 env.c 中实现如下函数：
  * `env_init()` 初始化 envs 数组中的所有 Env 结构，并将它们添加到 env_free_list 中。同时调用env_init_percpu，为特权级别0（内核）和特权级别3（用户）配置分段硬件。
  * `env_setup_vm()` 为新环境分配一个页面目录，并初始化新环境的地址空间的内核部分。
  * `region_alloc()` 为环境分配空间并映射物理内存。
  * `load_icode()` 解析一个ELF二进制镜像，就像启动加载器已经做的那样，并将其内容加载到一个新环境的用户地址空间。
  * `env_create()` 用env_alloc分配一个环境，并调用load_icode将一个ELF二进制文件加载到其中。
  * `env_run()` 启动一个以用户模式运行的特定环境。

* 使用 cprintf 中 %e 可以打印出与错误代码相对应的描述。例如：

	r = -E_NO_MEM;
	panic("env_alloc: %e", r);

会出现 "env_alloc: out of memory "的 panic。

下面是到调用用户代码的地方为止的代码调用图。请确保你理解每一步的目的。

* start (kern/entry.S)
* i386_init (kern/init.c)
  * cons_init
  * mem_init
  * env_init
  * trap_init (此时还未实现)
  * env_create
  * env_run
  * env_pop_tf

一旦完成后，应当在 qemu 中编译并执行内核。如果一切顺利，系统应该进入用户空间并执行 hello 二进制，直到它用 int 指令进行系统调用。在这一点上会有麻烦，因为 JOS 没有设置硬件来允许任何形式的从用户空间到内核的过渡。当 CPU 发现没有被设置为处理这个系统调用中断时，将会产生一个一般保护异常，发现它不能处理，产生一个双重故障异常，发现它也不能处理，最后以所谓的 "三重故障 "放弃。通常情况下，会看到 CPU 复位和系统重启。虽然这对传统应用程序很重要（见这篇博文的解释），但对内核开发来说是个麻烦，所以在 6.828补丁的QEMU中，你会看到一个寄存器转储和一个 "三重故障 "信息。

我们将很快解决这个问题，但现在我们可以使用调试器来检查我们是否进入了用户模式。使用qemu-gdb，在env_pop_tf处设置一个GDB断点，这应该是你在实际进入用户模式之前碰到的最后一个函数。使用si单步通过这个函数；处理器应该在iret指令之后进入用户模式。现在使用b *0x...在hello中sys_cputs()的int $0x30处设置断点（用户空间地址见obj/user/hello.asm）。这个int是向控制台显示一个字符的系统调用。如果你不能执行到int，那么你的地址空间设置或程序加载代码就有问题；在继续之前，请回去修正它。

### Exercise 2.

回顾一下，从 lab2 如何跳转到 lab3：在 `i386_init()` 函数中，经过 `mem_init()` 函数对内存初始化。接下来通过 `env_init()` 实现环境的初始化。也就是进入 lab3 。

1. 实现 `env_init()` ：

根据注释可知，将'envs'中的所有环境标记为自由，将其 env_ids 设置为 0 并将其插入 env_free_list 中。确保环境以同样的顺序插入 free list 中。它们在envs数组中（也就是说，这样第一次调用 env_alloc()就会返回 envs[0] ）。

```cpp
	for (int i = NENV - 1; i >= 0; i--) {
		envs[i].env_id = 0;
		envs[i].env_status = ENV_FREE;
		envs[i].env_link = env_free_list;
		env_free_list = &envs[i];
	}
```

2. 实现 `env_setup_vm()` ：

为环境 e 初始化内核虚拟内存布局。分配一个页面目录，相应地设置 `e->env_pgdir` ，并初始化新环境的地址空间的内核部分。不要把任何东西映射到环境的虚拟地址空间的用户部分。

返回数字为零表示成功，小于零表示错误，例如 -E_NO_MEM 表示页目录或页表没有被正确分配。

设置`e->env_pgdir`并初始化页面目录。所有环境的 VA 空间在 UTOP 以上是相同的，除了在 UVPT 处，我们在下面设置了这个空间。关于权限和布局，见`inc/memlayout.h`。可以使用 `kern_pgdir` 作为模板。

确保在 lab2 获得了正确的权限。UTOP 之下的虚拟内存是空的，不需要使用 `page_alloc()` 。

注意：一般来说，对于只在 UTOP 以上映射的物理页，pp_ref 不被维护，但是 env_pgdir 是一个例外--需要增加 env_pgdir 的 pp_ref ，以便 env_free 能够正确工作。 kern/pmap.h 中的函数是很方便的。

```c
	p->pp_ref++;
	e->env_pgdir = (pde_t *)page2kva(p);
	memcpy(e->env_pgdir, kern_pgdir, PGSIZE);
```

3. `region_alloc()` 为环境分配空间并映射物理内存。

不以任何方式调零或以其他方式初始化映射的页面。用户和内核应该可以写入页面。如果任何分配尝试失败，则 panic 。但只有当你需要它来加载 _icode 时才会如此。

提示：如果调用者能够传递非页对齐的'va'和'len'值，那么使用 region_alloc 会更容易。你应该将 va 向下取整，并将（va + len）向上取整。注意 corner-cases !

```cpp
static void
region_alloc(struct Env *e, void *va, size_t len)
{
	struct PageInfo *page = NULL;
	va = ROUNDDOWN(va, PGSIZE);
	void *end = (void *)ROUNDUP(va + len, PGSIZE);
	for (; va < end; va += PGSIZE) {
		if (!(page = page_alloc(ALLOC_ZERO))) {
			panic("region_alloc: alloc failed.");
		}
		if (page_insert(e->env_pgdir, page, va, PTE_U | PTE_W)) {
			panic("region_alloc: page mapping failed.");
		}
	}
}
```

4. 实现 `load_icode()` 解析一个ELF二进制镜像，就像启动加载器已经做的那样，并将其内容加载到一个新环境的用户地址空间。

为一个用户进程设置初始程序二进制、堆栈和处理器标志。这个函数只在内核初始化时调用，在运行第一个用户模式环境之前。

这个函数从 ELF 二进制映像中的所有可加载段加载到环境的用户内存中，从 ELF 程序头中指示的适当的虚拟地址开始。同时，它将这些段的任何部分清除为零，这些段在程序头中被标记为被映射，但实际上并不存在于 ELF 文件中，即程序的 bss 部分。w所有这些和我们的 Boot Loader 所做的非常相似，除了 Boot Loader 还需要从磁盘上读取代码。看一下 `boot/main.c` 来获得灵感。最后，这个函数为程序的初始堆栈映射了一个页面。 如果遇到问题，load_icode 会 panic 。  - load_icode 怎么会失败？ 给定的输入可能有什么问题？

5. `env_create()` 用 env_alloc 分配一个环境，并调用 load_icode 将一个 ELF 二进制文件加载到其中。



6. `env_run()` 启动一个以用户模式运行的特定环境。



## Handling Interrupts and Exceptions

在这一点上，用户空间的第一个`int 0x30`系统调用指令是一个死胡同：一旦处理器进入用户模式，就没有办法再出来。你现在需要实现基本的异常和系统调用处理，这样内核就有可能从用户模式代码中恢复对处理器的控制。你应该做的第一件事是彻底熟悉x86中断和异常机制。

* Exercise 3. Read Chapter 9, Exceptions and Interrupts in the 80386 Programmer's Manual (or Chapter 5 of the IA-32 Developer's Manual), if you haven't already.





