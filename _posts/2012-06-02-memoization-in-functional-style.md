---
layout: post
title: "Memoization in Functional Style"
description: "函数式语言一种优化方法"
category: lisp
tags: [land-of-lisp]
disqus: true
---
{% include JB/setup %}

## 函数式的记忆优化

记忆利用闭包。这种优化只对函数式有用。函数的行为只受输入参数约束，函数所做的仅仅是计算并将结果返回给调用者。

优化的地方在于：记住每次传递的参数和计算的结果。

我们的[Dice of Doom][3]游戏可以做如下优化：

### 记忆neighbors Function

正如你所记得的，neighbors函数重复检查board的所有边。然而board的形状比赛中从来不变化，这个函数的结果不会变化！

{% highlight cl%}
(let ((old-neighbors (symbol-function 'neighbors))
      (previous (make-hash-table)))
  (defun neighbors (pos)
    (or (gethash pos previous)
        (setf (gethash pos previous) (funcall old-neighbors pos)))))
{% endhighlight %}

首先我们把老的neighbors函数保存在局部变量old-neighbors中。symbol-function命令仅仅取得绑在这个符号上的函数。

接下来，我们定义一个局部变量previous，用来存放所有先前的参数和结果。

然后我们把先前的neighbors覆盖掉，然后？很显然，每调用一次后检查是否previous已有，若没有则调用老函数并保存参数和结果。

注意……这种函数处理行为可能搞的很乱……

### 记忆Game Tree

game tree的生成是整个程序最大的开销，可以这样优化。

{% highlight cl%}
(let ((old-game-tree (symbol-function 'game-tree))
      (previous (make-hash-table :test #'equalp)))
  (defun game-tree (&rest rest)
    (or (gethash rest previous)
       (setf (gethash rest previous) (apply old-game-tree rest)))))
{% endhighlight %}
因为哈希表中的对象是array，所以我们用`equalp`代替`eql`。`&rest`接受任意数量参数。

###记忆rate-position函数

这是用lisp实现人工智能中minmax算法中的一个函数，我好像还没纪录人工智能那部分。
如下：
{% highlight cl%}
(let ((old-rate-position (symbol-function 'rate-position))
      (previous (make-hash-table)))
  (defun rate-position (tree player)
    (let ((tab (gethash player previous)))
      (unless tab
        (setf tab (setf (gethash player previous) (make-hash-table))))
      (or (gethash tree tab)
          (setf (gethash tree tab)
                (funcall old-rate-position tree player))))))
{% endhighlight %}
我们需要做些特殊的东西，因为传递进rate-position中的参数。游戏树将非常之大，所以我们必定不要用equal或相似的这种比较大列表相当慢的函数来比较一个游戏树，取而代之，我们用eql，因此我们分开处理函数的两个参数，通过内嵌哈希表实现。

首先创建一个用eql比较的外部哈希表，然后定义一个tab变量在外部哈希表中查找我们的其中一个参数player，获取内部hash表。如果外部没查找到，我们建一个空的内建哈希表，用同样的键保存在外部哈希表中，剩下的例子和先前一样，除了我们使用内嵌哈希表，把tree这个参数作为键值。

## 注意

记忆化可以优化函数式程序，然而记忆化本身一点也不函数式。所以说函数式必然效率低么？其实这种优化我倒希望编译器能自动完成。

## 补记

这些日子忙着准备考试，然而考试当天剩一小时写完果断交卷。对大学考试已经没任何想法了，浪费我时间而已。

land of lisp根本这几天就没看，试了试[racket][1]，相当有意思，库也挺强大。我还是喜欢只有47页规范的scheme啊，所以看完land of lisp想先看看[How to Design Programms][2],common lisp上前页的规范真不是newbie friendly。

[1]: http://racket-lang.org/

[2]: http://htdp.org

[3]: /lisp/2012/05/23/dice-of-doom/
