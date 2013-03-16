---
layout: post
title: "Advanced Python Constructs(译)"
excerpt: "翻译自scipy lecture notes"
category: python
tags: [python， scipy-lecture-notes]
disqus: true
---
{% include JB/setup %}

# 高级Python结构

原谅渣翻译，可能仅仅是给我自己看的……

翻译自[http://scipy-lectures.github.com/advanced/advanced\_python/index.html](http://scipy-lectures.github.com/advanced/advanced_python/index.html)

作者:	Zbigniew Jędrzejewski-Szmek

这章有关Python中被认为高级的特性——就是说并不是每个语言都有的，也是说它们可能在更复杂的程序或库中更有用，但不是说特别特殊或特别复杂。

强调这点很重要：这一章仅仅关于语言自身——关于辅之以Python的标准库功能的特殊语法所支持的特性，不包括那些智能的外部模块实现。

在开发Python程序语言的过程中，它的语法，独一无二。因为它非常透明。建议的更改通过不同的角度评估并在公开邮件列表讨论，最终决定考虑到假设用例的重要性、添加更多特性的负担，其余语法的一致性、是否建议的变种易于读写和理解之间的平衡。这个过程由Python Enhancement Proposals([PEPs](http://www.python.org/dev/peps/))的形式规范。最终这一章节中描述的特性在证明它们确实解决实际问题并且使用起来尽可能简单后被添加。

---
**目录**

* toc
{: toc}

---

## 迭代器(Iterators), 生成表达式(generator expressions)和生成器(generators)

### 迭代器

> **Simplicity**
> 
> Duplication of effort is wasteful, and replacing the various home-grown approaches with a standard feature usually ends up making things more readable, and interoperable as well.
> 
>     Guido van Rossum — [Adding Optional Static Typing to Python](http://www.artima.com/weblogs/viewpost.jsp?thread=86641)



迭代器是依附于[迭代协议](http://docs.python.org/dev/library/stdtypes.html#iterator-types)的对象——基本意味它有一个`next`方法(method)，当调用时，返回序列中的下一个项目。当无项目可返回时，引发(raise)`StopIteration`异常。

迭代对象允许一次循环。它保留单次迭代的状态(位置)，或从另一个角度讲，每次循环序列都需要一个迭代对象。这意味我们可以同时迭代同一个序列不只一次。将迭代逻辑和序列分离使我们有更多的迭代方式。

调用一个容器(container)的`__iter__`方法创建迭代对象是掌握迭代器最直接的方式。`iter`函数为我们节约一些按键。

    >>> nums = [1,2,3]      # note that ... varies: these are different objects
    >>> iter(nums)                           
    <listiterator object at ...>
    >>> nums.__iter__()                      
    <listiterator object at ...>
    >>> nums.__reversed__()                  
    <listreverseiterator object at ...>

    >>> it = iter(nums)
    >>> next(it)            # next(obj) simply calls obj.next()
    1
    >>> it.next()
    2
    >>> next(it)
    3
    >>> next(it)
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    StopIteration

当在循环中使用时，`StopIteration`被接受并停止循环。但通过显式引发(invocation)，我们看到一旦迭代器元素被耗尽，存取它将引发异常。

使用`for...in`循环也使用`__iter__`方法。这允许我们透明地开始对一个序列迭代。但是如果我们已经有一个迭代器，我们想在for循环中能同样地使用它们。为了实现这点，迭代器除了`next`还有一个方法`__iter__`来返回迭代器自身(self)。

Python中对迭代器的支持无处不在：标准库中的所有序列和无序容器都支持。这个概念也被拓展到其它东西：例如`file`对象支持行的迭代。

    >>> f = open('/etc/fstab')
    >>> f is f.__iter__()
    True

`file`自身就是迭代器，它的`__iter__`方法并不创建一个单独的对象：仅仅单线程的顺序读取被允许。

### 生成表达式

第二种创建迭代对象的方式是通过 _生成表达式(generator expression)_ ，列表推导(list comprehension)的基础。为了增加清晰度，生成表达式总是封装在括号或表达式中。如果使用圆括号，则创建了一个生成迭代器(generator iterator)。如果是方括号，这一过程被‘短路’我们获得一个列表`list`。

    >>> (i for i in nums)                    
    <generator object <genexpr> at 0x...>
    >>> [i for i in nums]
    [1, 2, 3]
    >>> list(i for i in nums)
    [1, 2, 3]

在Python 2.7和 3.x中列表表达式语法被扩展到 _字典和集合表达式_。一个集合`set`当生成表达式是被大括号封装时被创建。一个字典`dict`在表达式包含`key:value`形式的键值对时被创建：

    >>> {i for i in range(3)}   
    set([0, 1, 2])
    >>> {i:i**2 for i in range(3)}   
    {0: 0, 1: 1, 2: 4}

如果您不幸身陷古老的Python版本中，这个语法有点糟：

    >>> set(i for i in 'abc')
    set(['a', 'c', 'b'])
    >>> dict((i, ord(i)) for i in 'abc')
    {'a': 97, 'c': 99, 'b': 98}

生成表达式相当简单，不用多说。只有一个陷阱值得提及：在版本小于3的Python中索引变量(`i`)会泄漏。

### 生成器

> **Generators**
> 
> A generator is a function that produces a sequence of results instead of a single value.
> 
>     David Beazley — [A Curious Course on Coroutines and Concurrency](http://www.dabeaz.com/coroutines/)

第三种创建迭代对象的方式是调用生成器函数。一个 _生成器(generator)_ 是包含关键字`yield`的函数。值得注意，仅仅是这个关键字的出现完全改变了函数的本质：`yield`语句不必引发(invoke)，甚至不必可接触。但让函数变成了生成器。当一个函数被调用时，其中的指令被执行。而当一个生成器被调用时，执行在其中第一条指令之前停止。生成器的调用创建依附于迭代协议的生成器对象。就像常规函数一样，允许并发和递归调用。

当`next`被调用时，函数执行到第一个`yield`。每次遇到`yield`语句获得一个作为`next`返回的值，在`yield`语句执行后，函数的执行又被停止。

    >>> def f():
    ...   yield 1
    ...   yield 2
    >>> f()                                   
    <generator object f at 0x...>
    >>> gen = f()
    >>> gen.next()
    1
    >>> gen.next()
    2
    >>> gen.next()
    Traceback (most recent call last):
     File "<stdin>", line 1, in <module>
    StopIteration

让我们遍历单个生成器函数调用的整个历程。

    >>> def f():
    ...   print("-- start --")
    ...   yield 3
    ...   print("-- middle --")
    ...   yield 4
    ...   print("-- finished --")
    >>> gen = f()
    >>> next(gen)
    -- start --
    3
    >>> next(gen)
    -- middle --
    4
    >>> next(gen)                            
    -- finished --
    Traceback (most recent call last):
     ...
    StopIteration

相比常规函数中执行`f()`立即让`print`执行，`gen`不执行任何函数体中语句就被赋值。只有当`gen.next()`被`next`调用，直到第一个`yield`部分的语句才被执行。第二个语句打印`-- middle --`并在遇到第二个yield时停止执行。第三个`next`打印`-- finished --`并且到函数末尾，因为没有`yield`，引发了异常。

当函数yield之后控制返回给调用者后发生了什么？每个生成器的状态被存储在生成器对象中。从这点看生成器函数，好像它是运行在单独的线程，但这仅仅是假象：执行是严格单线程的，但解释器保留和存储在下一个值请求之间的状态。[^1]

为何生成器有用？正如关于迭代器这部分强调的，生成器函数只是创建迭代对象的又一种方式。一切能被`yield`语句完成的东西也能被`next`方法完成。然而，使用函数让解释器魔力般地创建迭代器有优势。一个函数可以比需要`next`和`__iter__`方法的类定义短很多。更重要的是，相比不得不对迭代对象在连续`next`调用之间传递的实例(instance)属性来说，生成器的作者能更简单的理解局限在局部变量中的语句。

还有问题是为何迭代器有用？当一个迭代器用来驱动循环，循环变得简单。迭代器代码初始化状态，决定是否循环结束，并且找到下一个被提取到不同地方的值。这凸显了循环体——最值得关注的部分。除此之外，可以在其它地方重用迭代器代码。

### 双向通信

每个`yield`语句将一个值传递给调用者。这就是为何[PEP 255](http://www.python.org/dev/peps/pep-0255)引入生成器(在Python2.2中实现)。但是相反方向的通信也很有用。一个明显的方式是一些外部(extern)语句，或者全局变量或共享可变对象。通过将先前无聊的`yield`语句变成表达式，直接通信因[PEP 342](http://www.python.org/dev/peps/pep-0342)成为现实(在2.5中实现)。当生成器在yield语句之后恢复执行时，调用者可以对生成器对象调用一个方法，或者传递一个值 _给_ 生成器，然后通过`yield`语句返回，或者通过一个不同的方法向生成器注入异常。

第一个新方法是`send(value)`，类似于`next()`，但是将`value`传递进作为yield表达式值的生成器中。事实上，`g.next()`和`g.send(None)`是等效的。

第二个新方法是`throw(type, value=None, traceback=None)`，等效于在yield语句处

    raise type, value, traceback

不像`raise`(从执行点立即引发异常)，`throw()`首先恢复生成器，然后仅仅引发异常。选用单次throw就是因为它意味着把异常放到其它位置，并且在其它语言中与异常有关。

当生成器中的异常被引发时发生什么？它可以或者显式引发，当执行某些语句时可以通过`throw()`方法注入到yield语句中。任一情况中，异常都以标准方式传播：它可以被`except`和`finally`捕获，或者造成生成器的中止并传递给调用者。

因完整性缘故，值得提及生成器迭代器也有`close()`方法，该方法被用来让本可以提供更多值的生成器立即中止。它用生成器的`__del__`方法销毁保留生成器状态的对象。

让我们定义一个只打印出通过send和throw方法所传递东西的生成器。

    >>> import itertools
    >>> def g():
    ...     print '--start--'
    ...     for i in itertools.count():
    ...         print '--yielding %i--' % i
    ...         try:
    ...             ans = yield i
    ...         except GeneratorExit:
    ...             print '--closing--'
    ...             raise
    ...         except Exception as e:
    ...             print '--yield raised %r--' % e
    ...         else:
    ...             print '--yield returned %s--' % ans
    
    >>> it = g()
    >>> next(it)
    --start--
    --yielding 0--
    0
    >>> it.send(11)
    --yield returned 11--
    --yielding 1--
    1
    >>> it.throw(IndexError)
    --yield raised IndexError()--
    --yielding 2--
    2
    >>> it.close()
    --closing--

**注意： `next`还是`__next__`?**

**在Python 2.x中，接受下一个值的迭代器方法是`next`，它通过全局函数`next`显式调用，意即它应该调用`__next__`。就像全局函数`iter`调用`__iter__`。这种不一致在Python 3.x中被修复，`it.next`变成了`it.__next__`。对于其它生成器方法——`send`和`throw`情况更加复杂，因为它们不被解释器隐式调用。然而，有建议语法扩展让`continue`带一个将被传递给循环迭代器中`send`的参数。如果这个扩展被接受，可能`gen.send`会变成`gen.__send__`。最后一个生成器方法`close`显然被不正确的命名了，因为它已经被隐式调用。**

### 链式生成器

**注意： 这是[PEP 380](http://www.python.org/dev/peps/pep-0380)的预览(还未被实现，但已经被Python3.3接受)[^2]**

比如说我们正写一个生成器，我们想要yield一个第二个生成器——一个子生成器(subgenerator)——生成的数。如果仅考虑产生(yield)的值，通过循环可以不费力的完成：

    subgen = some_other_generator()
    for v in subgen:
        yield v

然而，如果子生成器需要调用`send()`、`throw()`和`close()`和调用者适当交互的情况下，事情就复杂了。`yield`语句不得不通过类似于前一章节部分定义的`try...except...finally`结构来保证“调试”生成器函数。这种代码在[PEP 380](http://www.python.org/dev/peps/pep-0380#id13)中提供，现在足够拿出将在Python 3.3中引入的新语法了：

    yield from some_other_generator()

像上面的显式循环调用一样，重复从`some_other_generator`中产生值直到没有值可以产生，但是仍然向子生成器转发`send`、`throw`和`close`。

## 装饰器

> Summary
> 
> This amazing feature appeared in the language almost apologetically and with concern that it might not be that useful.
> 
>	Bruce Eckel — An Introduction to Python Decorators

因为函数或类都是对象，它们也能被四处传递。它们又是可变对象，可以被更改。在函数或类对象创建后但绑定到名字前更改之的行为为装饰(decorator)。[^4]

“装饰器”后隐藏了两种意思——一是函数起了装饰作用，例如，执行真正的工作，另一个是依附于装饰器语法的表达式，例如，at符号和装饰函数的名称。

函数可以通过函数装饰器语法装饰：

    @decorator             # ②
    def function():        # ①
        pass

- 函数以标准方式定义。①
- 以`@`做为定义为装饰器函数前缀的表达式②。在 @ 后的部分必须是简单的表达式，通常只是函数或类的名字。这一部分先求值，在下面的定义的函数准备好后，装饰器被新定义的函数对象作为单个参数调用。装饰器返回的值附着到被装饰的函数名。

装饰器可以应用到函数和类上。对类语义很明晰——类定义被当作参数来调用装饰器，无论返回什么都赋给被装饰的名字。

在装饰器语法实现前([PEP 318](http://www.python.org/dev/peps/pep-0318))，通过将函数和类对象赋给临时变量然后显式调用装饰器然后将返回值赋给函数名，可以完成同样的事。这似乎要打更多的字，也确实装饰器函数名用了两次同时临时变量要用至少三次，很容易出错。以上实例相当于：

    def function():                  # ①
        pass
    function = decorator(function)   # ②

装饰器可以堆栈(stacked)——应用的顺序是从底到上或从里到外。就是说最初的函数被当作第一次参数器的参数，无论返回什么都被作为第二个装饰器的参数……无论最后一个装饰器返回什么都被依附到最初函数的名下。

装饰器语法因其可读性被选择。因为装饰器在函数头部前被指定，显然不是函数体的一部分，它只能对整个函数起作用。以@为前缀的表达式又让它明显到不容忽视(根据PEP叫在您脸上……：）)。当多个装饰器被应用时，每个放在不同的行非常易于阅读。

### 代替和调整原始对象

装饰器可以或者返回相同的函数或类对象或者返回完全不同的对象。第一种情况中，装饰器利用函数或类对象是可变的添加属性，例如向类添加文档字符串(docstring).装饰器甚至可以在不改变对象的情况下做有用的事，例如在全局注册表中注册装饰的类。在第二种情况中，简直无所不能：当什么不同的东西取代了被装饰的类或函数，新对象可以完全不同。然而这不是装饰器的目的：它们意在改变装饰对象而非做不可预料的事。因此当一个函数在装饰时被完全替代成不同的函数时，新函数通常在一些准备工作后调用原始函数。同样，当一个类被装饰成一个新类时，新类通常源于被装饰类。当装饰器的目的是“每次都”做什么，像记录每次对被装饰函数的调用，只有第二类装饰器可用。另一方面，如果第一类足够了，最好使用它因为更简单。[^3]

### 实现类和函数装饰器

对装饰器惟一的要求是它能够单参数调用。这意味着装饰器可以作为常规函数或带有`__call__`方法的类的实现，理论上，甚至lambda函数也行。

让我们比较函数和类方法。装饰器表达式(@后部分)可以只是名字。只有名字的方法很好(打字少，看起来整洁等)，但是只有当无需用参数定制装饰器时才可能。被写作函数的装饰器可以用以下两种方式：

    >>> def simple_decorator(function):
    ...   print "doing decoration"
    ...   return function
    >>> @simple_decorator
    ... def function():
    ...   print "inside function"
    doing decoration
    >>> function()
    inside function


    >>> def decorator_with_arguments(arg):
    ...   print "defining the decorator"
    ...   def _decorator(function):
    ...       # in this inner function, arg is available too
    ...       print "doing decoration,", arg
    ...       return function
    ...   return _decorator
    >>> @decorator_with_arguments("abc")
    ... def function():
    ...   print "inside function"
    defining the decorator
    doing decoration, abc
    >>> function()
    inside function

这两个装饰器属于返回被装饰函数的类别。如果它们想返回新的函数，需要额外的嵌套，最糟的情况下，需要三层嵌套。

    >>> def replacing_decorator_with_args(arg):
    ...   print "defining the decorator"
    ...   def _decorator(function):
    ...       # in this inner function, arg is available too
    ...       print "doing decoration,", arg
    ...       def _wrapper(*args, **kwargs):
    ...           print "inside wrapper,", args, kwargs
    ...           return function(*args, **kwargs)
    ...       return _wrapper
    ...   return _decorator
    >>> @replacing_decorator_with_args("abc")
    ... def function(*args, **kwargs):
    ...     print "inside function,", args, kwargs
    ...     return 14
    defining the decorator
    doing decoration, abc
    >>> function(11, 12)
    inside wrapper, (11, 12) {}
    inside function, (11, 12) {}
    14

`_wrapper`函数被定义为接受所有位置和关键字参数。通常我们不知道哪些参数被装饰函数会接受，所以wrapper将所有东西都创递给被装饰函数。一个不幸的结果就是显式参数很迷惑人。

相比定义为函数的装饰器，定义为类的复杂装饰器更简单。当对象被创建，`__init__`方法仅仅允许返回`None`，创建的对象类型不能更改。这意味着当装饰器被定义为类时，使用无参数的形式没什么意义：最终被装饰的对象只是装饰类的一个实例而已，被构建器(constructor)调用返回，并不非常有用。讨论在装饰表达式中给出参数的基于类的装饰器，`__init__`方法被用来构建装饰器。

    >>> class decorator_class(object):
    ...   def __init__(self, arg):
    ...       # this method is called in the decorator expression
    ...       print "in decorator init,", arg
    ...       self.arg = arg
    ...   def __call__(self, function):
    ...       # this method is called to do the job
    ...       print "in decorator call,", self.arg
    ...       return function
    >>> deco_instance = decorator_class('foo')
    in decorator init, foo
    >>> @deco_instance
    ... def function(*args, **kwargs):
    ...   print "in function,", args, kwargs
    in decorator call, foo
    >>> function()
    in function, () {}

相对于正常规则([PEP 8](http://www.python.org/dev/peps/pep-0008))由类写成的装饰器表现得更像函数，因此它们的名字以小写字母开始。

事实上，创建一个仅返回被装饰函数的新类没什么意义。对象应该有状态，这种装饰器在装饰器返回新对象时更有用。

    >>> class replacing_decorator_class(object):
    ...   def __init__(self, arg):
    ...       # this method is called in the decorator expression
    ...       print "in decorator init,", arg
    ...       self.arg = arg
    ...   def __call__(self, function):
    ...       # this method is called to do the job
    ...       print "in decorator call,", self.arg
    ...       self.function = function
    ...       return self._wrapper
    ...   def _wrapper(self, *args, **kwargs):
    ...       print "in the wrapper,", args, kwargs
    ...       return self.function(*args, **kwargs)
    >>> deco_instance = replacing_decorator_class('foo')
    in decorator init, foo
    >>> @deco_instance
    ... def function(*args, **kwargs):
    ...   print "in function,", args, kwargs
    in decorator call, foo
    >>> function(11, 12)
    in the wrapper, (11, 12) {}
    in function, (11, 12) {}

像这样的装饰器可以做任何事，因为它能改变被装饰函数对象和参数，调用被装饰函数或不调用，最后改变返回值。

### 复制原始函数的文档字符串和其它属性

当新函数被返回代替装饰前的函数时，不幸的是原函数的函数名，文档字符串和参数列表都丢失了。这些属性可以部分通过设置`__doc__`(文档字符串)，`__module__`和`__name__`(函数的全称)、`__annotations__`(Python 3中关于参数和返回值的额外信息)移植到新函数上，这些工作可通过`functools.update_wrapper`自动完成。

    >>> import functools
    >>> def better_replacing_decorator_with_args(arg):
    ...   print "defining the decorator"
    ...   def _decorator(function):
    ...       print "doing decoration,", arg
    ...       def _wrapper(*args, **kwargs):
    ...           print "inside wrapper,", args, kwargs
    ...           return function(*args, **kwargs)
    ...       return functools.update_wrapper(_wrapper, function)
    ...   return _decorator
    >>> @better_replacing_decorator_with_args("abc")
    ... def function():
    ...     "extensive documentation"
    ...     print "inside function"
    ...     return 14
    defining the decorator
    doing decoration, abc
    >>> function                           
    <function function at 0x...>
    >>> print function.__doc__
    extensive documentation

一件重要的东西是从可迁移属性列表中所缺少的：参数列表。参数的默认值可以通过`__defaults__`、`__kwdefaults__`属性更改，但是不幸的是参数列表本身不能被设置为属性。这意味着`help(function)`将显式无用的参数列表，使使用者迷惑不已。一个解决此问题有效但是丑陋的方式是使用`eval`动态创建wrapper。可以使用外部`external`模块自动实现。它提供了对`decorator`装饰器的支持，该装饰器接受wrapper并将之转换成保留函数签名的装饰器。

综上，装饰器应该总是使用`functools.update_wrapper`或者其它方式赋值函数属性。

### 标准库中的示例



### 函数的废弃

### while-loop移除装饰器

### 插件注册系统

### 更多例子和参考

## 上下文管理器

### 捕获异常

### 使用生成器定义上下文管理器

---

## FootNotes

[^1]:就像CPU工作一样，中断时保存断点，最后又恢复。
[^2]:好吧它已经发布了= =，虽然在大多linux发行版中还是2.x和3.2。
[^3]:看糊涂了吧，我也糊涂了……
[^4]：[装饰器和函数式编程](http://youngsterxyf.github.com/2013/01/04/Decorators-and-Functional-Python/)
