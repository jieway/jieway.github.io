---
title: 'C 语言 OOP 编程'
date: '2023-12-29'
---

工作中使用的是 C 语言，但是很多东西本质上还是面向对象的搞法，这篇文章专门做个总结。

C 语言是面向过程的，我认为面向对象是对结构体的进一步扩展，虽然没有语言层面的原生支持，但是通过结构体也能模拟面向对象。

## 0. 和 C++ 对比 C 语言如何实现成员变量和成员方法？

实现C语言中的成员变量和成员方法，相较于C++，需要采用不同的技巧和设计模式。C++作为一种面向对象语言，直接支持成员变量和成员方法的概念，而C语言作为一种过程式语言，则需要依赖于结构体和函数来模拟这些特性。

### 成员变量和成员方法在C++中的实现

在C++中，类的定义自然包含了成员变量和成员方法。成员变量用于存储对象的状态，而成员方法用于定义对象的行为。

```cpp
class MyClass {
private:
    int memberVariable; // 成员变量

public:
    MyClass(int value) : memberVariable(value) {} // 构造函数

    void memberFunction() { // 成员方法
        // 对成员变量进行操作
        memberVariable++;
    }

    int getMemberVariable() const {
        return memberVariable;
    }
};
```

在这个例子中，`memberVariable`是一个成员变量，`memberFunction`是一个成员方法，可以直接操作成员变量。

### 模拟成员变量和成员方法在C语言中的实现

在C语言中，可以通过结构体来模拟类，并用函数来模拟成员方法。结构体中的字段类似于成员变量，而单独的函数（通常接受结构体指针作为参数）则充当成员方法。

#### 1. 使用结构体定义成员变量

在C语言中，结构体用于定义和存储数据，类似于C++中的类。

```c
typedef struct {
    int memberVariable; // 类似于成员变量
} MyClass;
```

#### 2. 定义函数模拟成员方法

由于C语言中的结构体不能包含函数，可以定义独立的函数并接受结构体的指针作为参数，来模拟成员方法。

```c
void MyClass_memberFunction(MyClass *obj) {
    if (obj) {
        obj->memberVariable++; // 操作成员变量
    }
}

int MyClass_getMemberVariable(const MyClass *obj) {
    return obj ? obj->memberVariable : 0;
}
```

#### 3. 使用模式

在C语言中使用这个“类”的方式类似于C++，但需要显式传递结构体的指针给函数。

```c
MyClass obj;
obj.memberVariable = 5;

MyClass_memberFunction(&obj);
int value = MyClass_getMemberVariable(&obj);
```

### 总结

- 在C++中，成员变量和成员方法是类的一部分，直接由语言支持，提供了强大的封装和抽象能力。
- 在C语言中，可以通过结构体和函数来模拟成员变量和成员方法。这种方法更加显式和笨拙，但可以在过程式语言中模拟出面向对象的特性。
- C语言的这种模拟方法需要开发者遵循特定的编码约定，以确保代码的可读性和维护性。

C语言模拟出的面向对象特性不如C++中的原生支持那样直观和强大，但它为在过程式语境下实现面向对象的设计提供了可能性。

## 1. 封装

C++作为一种原生支持面向对象编程（OOP）的语言，提供了类、访问控制（如public、private关键字）等内置特性来实现封装。而C语言，作为一种过程式语言，没有这些内置特性，但通过一些编程技巧可以模拟出类似的封装行为。

要理解C语言如何实现面向对象的封装特性，我们可以通过与C++的对比来进行阐述。C++作为一种原生支持面向对象编程（OOP）的语言，提供了类、访问控制（如public、private关键字）等内置特性来实现封装。而C语言，作为一种过程式语言，没有这些内置特性，但通过一些编程技巧可以模拟出类似的封装行为。

### 封装在C++中的实现

在C++中，封装通常通过类来实现。类可以有公共（public）、保护（protected）和私有（private）成员，从而控制对类成员的访问。例如：

```cpp
class MyClass {
private:
    int privateData;  // 私有成员，只能由类内的函数访问

public:
    MyClass(int val) : privateData(val) {} // 构造函数

    int getPrivateData() const { // 公共成员函数
        return privateData;
    }
};
```

在这个例子中，`privateData`是一个私有成员，外部代码无法直接访问。外部代码只能通过公共成员函数`getPrivateData`来访问`privateData`。

### 封装在C语言中的模拟

在C语言中，封装的实现依赖于结构体和函数。由于C语言没有内置的访问控制机制，因此需要依赖于编码约定和某些技巧来实现封装。

1. **使用结构体存储数据**：

   ```c
   typedef struct MyClass {
       int privateData; // 实际上是“公共”的，但通过约定视为“私有”
   } MyClass;
   ```

   在这里，我们将所有数据成员放在一个结构体中。虽然这些成员在技术上是公共的，但我们可以通过编码约定来将它们视为私有。

2. **在源文件中隐藏实现细节**：

   在C中，你可以在源文件中定义结构体，而在头文件中仅声明它，这样外部代码就无法直接访问结构体的成员：

   ```c
   // myclass.h
   typedef struct MyClass MyClass;

   // myclass.c
   struct MyClass {
       int privateData;
   };
   ```

3. **提供公共接口函数**：

   公共接口函数允许外部代码以受控的方式与结构体交互，类似于C++中的公共成员函数。

   ```c
   MyClass* myClass_create(int value);
   int myClass_getPrivateData(const MyClass* obj);
   ```

### 总结

- 在C++中，封装是通过类和访问修饰符（如private和public）实现的，使得数据隐藏和接口暴露成为语言的内置特性。
- 在C语言中，封装是通过结构体、将实现细节隐藏在源文件中、以及提供公共接口函数来模拟实现的。这需要开发者遵循特定的编码约定和模式。

通过这种方式，C语言可以模拟实现面向对象编程中的封装特性，尽管这种实现不如C++中原生的支持那样直接和强大。

## 2. 继承

在 C 语言中使用结构体嵌套来实现继承。

### 继承在C++中的实现

在C++中，继承是面向对象编程的核心特性之一。通过继承，子类可以继承父类的属性和方法。例如：

```cpp
class Base {
public:
    void baseMethod() {}
};

class Derived : public Base {
public:
    void derivedMethod() {}
};
```

在这个例子中，`Derived`类继承了`Base`类。这意味着`Derived`类的对象可以访问`baseMethod`，同时还可以有它自己的`derivedMethod`。

### 模拟继承在C语言中的实现

在C语言中，继承可以通过结构体嵌套和特定的函数指针来模拟。以下是步骤和关键点：

#### 1. 使用结构体嵌套

可以通过将一个结构体作为另一个结构体的成员来模拟继承。

```c
typedef struct {
    // 基类成员
} Base;

typedef struct {
    Base base; // 将基类作为成员嵌入
    // 派生类的额外成员
} Derived;
```

在这个例子中，`Derived`结构体包含了一个`Base`结构体作为其成员，这在一定程度上模拟了继承。

#### 2. 模拟方法的继承

由于C语言中结构体不能包含函数，可以通过在结构体中定义函数指针来模拟方法。如果需要，可以在派生类中“重写”这些函数指针。

```c
typedef struct {
    void (*baseMethod)(void);
} Base;

typedef struct {
    Base base;
    void (*derivedMethod)(void);
} Derived;
```

#### 3. 构造函数

可以定义函数来初始化这些结构体，相当于构造函数。

```c
void initBase(Base *b) {
    b->baseMethod = baseMethodImplementation;
}

void initDerived(Derived *d) {
    initBase(&d->base); // 初始化基类部分
    d->derivedMethod = derivedMethodImplementation;
}
```

#### 4. 使用嵌套结构体

当使用派生类时，可以通过指针转换来访问基类的成员。这在一定程度上模拟了多态。

```c
Derived d;
initDerived(&d);
d.base.baseMethod(); // 调用基类方法
d.derivedMethod(); // 调用派生类方法
```

### 总结

- 在C++中，继承是语言内置的特性，提供了直接、清晰和强大的继承机制。
- 在C语言中，继承可以通过结构体嵌套、函数指针和手动初始化来模拟。这种方法虽然可以实现类似继承的行为，但比C++中的继承更为笨重和复杂。
- C语言中的这种模拟方法需要程序员遵循严格的编码规范和设计模式，且在实现多态和方法重写时不如C++直接和灵活。

通过这种方式，C语言可以模拟实现面向对象编程中的继承特性，尽管这种实现在语法和灵活性上不如C++中的原生支持。

## 3. 多态

在C++中，多态是面向对象编程（OOP）的核心特性之一，主要通过虚函数和继承来实现。而在C语言中，由于缺乏原生的OOP支持，实现多态需要依赖函数指针和特定的设计模式。以下是与C++相对比的讲解：

### 多态在C++中的实现

在C++中，多态通常是通过虚函数来实现的。当一个函数在基类中被声明为虚函数时，派生类可以重写这个函数，而通过基类指针或引用调用时，将执行最具体派生类的版本。

```cpp
class Base {
public:
    virtual void doSomething() {
        // 基类实现
    }
};

class Derived : public Base {
public:
    void doSomething() override {
        // 派生类重写实现
    }
};

void polymorphicFunction(Base* base) {
    base->doSomething(); // 根据对象的实际类型调用相应的函数
}
```

在这个例子中，无论`polymorphicFunction`接收`Base`类的实例还是`Derived`类的实例，都会调用正确的`doSomething`方法。

### 模拟多态在C语言中的实现

在C语言中，多态可以通过结构体中的函数指针来模拟。这些函数指针类似于C++中的虚函数，但需要手动设置和管理。

#### 1. 定义带有函数指针的结构体

使用结构体定义方法，并在结构体中包含函数指针。

```c
typedef struct {
    void (*doSomething)(void*);
} Base;

void Base_doSomething(void* self) {
    // 基类的实现
}
```

#### 2. 派生结构体和重写函数

创建一个派生结构体，它包含基类作为第一个成员，然后定义新的函数来重写行为。

```c
typedef struct {
    Base base;
} Derived;

void Derived_doSomething(void* self) {
    // 派生类的实现
}
```

#### 3. 初始化函数

定义初始化函数来正确设置函数指针。

```c
void initBase(Base* base) {
    base->doSomething = Base_doSomething;
}

void initDerived(Derived* derived) {
    initBase((Base*)derived); // 初始化基类部分
    derived->base.doSomething = Derived_doSomething; // 重写函数
}
```

#### 4. 使用多态

通过基类指针调用函数，实现多态。

```c
void polymorphicFunction(Base* base) {
    base->doSomething(base); // 根据实际类型调用相应的函数
}

Derived d;
initDerived(&d);
polymorphicFunction((Base*)&d); // 调用派生类实现
```

### 总结

- 在C++中，多态是通过虚函数机制实现的，语言提供了直接和强大的支持。
- 在C语言中，多态可以通过包含函数指针的结构体和手动管理这些指针来模拟。这种方法更加手动和灵活，但也更加复杂和容易出错。
- C语言的这种方法需要开发者遵循严格的编码规范和设计模式，以确保正确地模拟多态。

尽管C语言可以模拟出类似于C++的多态特性，但由于缺乏语言层面的直接支持，这种实现在某些方面可能不如C++中的实现直接和强大。


## 4. 其他

### 4.1 如何根据对象在运行时动态的调用对应的成员函数？

简单来说是手动设定的，不是在运行时确定的，下面是一个具体的例子，通过 init 绑定。


在C语言中实现面向对象的多态，主要依赖于函数指针和结构体。多态的核心思想是在运行时决定调用哪个函数，这可以通过在结构体中存储指向不同函数的函数指针来实现。下面是一个具体的例子，展示了如何在C语言中模拟面向对象的多态：

### 定义基类和派生类

首先，我们定义一个“基类”结构体，其中包含一个指向函数的指针，这个函数代表类的行为。然后定义一个或多个“派生类”结构体，它们在基类的基础上增加新的行为或重写现有行为。

#### 1. 基类定义

```c
typedef struct {
    void (*doAction)(void *self); // 函数指针
} Animal;
```

#### 2. 派生类定义

```c
typedef struct {
    Animal base; // 基类
    // 可以添加派生类特有的成员
} Cat;

typedef struct {
    Animal base; // 基类
    // 可以添加派生类特有的成员
} Dog;
```

### 实现具体的行为函数

接下来，我们实现每个类（包括基类和派生类）特有的行为函数。

```c
void Animal_doAction(void *self) {
    printf("Animal action\n");
}

void Cat_doAction(void *self) {
    printf("Cat meow\n");
}

void Dog_doAction(void *self) {
    printf("Dog bark\n");
}
```

### 初始化函数

我们需要初始化函数来设置每个对象的`doAction`函数指针。这相当于构造函数，用于配置每个类的行为。

```c
void Animal_init(Animal *animal) {
    animal->doAction = Animal_doAction;
}

void Cat_init(Cat *cat) {
    Animal_init((Animal *)cat); // 初始化基类部分
    cat->base.doAction = Cat_doAction; // 设置特定于Cat的行为
}

void Dog_init(Dog *dog) {
    Animal_init((Animal *)dog); // 初始化基类部分
    dog->base.doAction = Dog_doAction; // 设置特定于Dog的行为
}
```

### 使用多态

现在我们可以创建各种动物类型的实例，并调用它们的`doAction`函数。在运行时，根据对象的实际类型调用相应的函数。

```c
int main() {
    Cat cat;
    Dog dog;

    Cat_init(&cat);
    Dog_init(&dog);

    // 通过基类指针调用
    Animal *animals[] = {(Animal *)&cat, (Animal *)&dog};
    for (int i = 0; i < sizeof(animals) / sizeof(Animal *); ++i) {
        animals[i]->doAction(animals[i]);
    }

    return 0;
}
```

在这个例子中，我们创建了`Cat`和`Dog`类型的对象，并将它们的基类部分的地址存储在`Animal`类型的数组中。当我们遍历这个数组并调用`doAction`函数时，会根据对象的实际类型（`Cat`或`Dog`）动态调用对应的函数。

### 总结

通过这种方式，我们可以在C语言中模拟实现面向对象的多态。这种方法依赖于结构体、函数指针和类型转换来动态决定运行时调用哪个函数。虽然这种方法不如C++中的虚函数直接和优雅，但它提供了一种在C语言中实现类似面向对象行为的可行途径。


