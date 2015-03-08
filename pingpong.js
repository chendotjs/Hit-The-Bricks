/**
 * author:chen yaqi
 * email:chendotjs@gmail.com
 *
 * 第一次使用canvas写程序，做的比较粗糙，只能做个参考。
 */

var pingpong=function(){
    //闭包里面的变量，可以被闭包里面的函数使用，却不会污染全局命名空间
    var container;//canvas DOM元素
    var width;
    var height;
    var context;//canvas的context
    var rd=false,ld=false;//布尔型，指示键盘左右键是否被按下
    var pause=true; //是否开始的标志
    var stop_callBack;//结束后的回调函数

    /**
     * Stage类，初始化一些闭包外面的变量以及实例化需要用到的类
     * @param {[type]}  canvas DOM元素
     */
    var Stage=function(ct,f){ 
        'use strict'
        //初始化一些闭包外面的变量
        container=ct;
        context=container.getContext('2d')
        height=container.height=600;
        width=container.width=600;
        stop_callBack=f;//结束后的回调函数

        var ballPos=this.initialPos();
        //构造一个球的示例，半径为8
        this.ball = new Ball(ballPos.x,ballPos.y,8); 
        //宽100，厚10的挡板
        this.paddle=new Paddle(100,10);
        //砖块8*8
        this.bricks=new Bricks(8,8);
    }

    /**
     * Ball类
     * @param {[type]}  圆心横坐标
     * @param {[type]}  圆心纵坐标
     * @param {[type]}  圆的半径
     */
    var Ball=function(x,y,r){
        'use strict'
        this.radius=r;
        this.x=x;
        this.y=y;
        this.dx=5;this.dy=4;    //下一帧圆心移动的像素    
    }

    /**
     * Paddle类
     * @param {[type]} w 挡板的宽度
     * @param {[type]} h 挡板的厚度
     */
    var Paddle=function(w,h){
        'use strict'
        this.width=w;//挡板的宽度
        this.height=h;//挡板的厚度
        this.posX=(width-this.width)/2;//挡板最左边的坐标，可以确定挡板的位置
        this.dx=15//10;//挡板横向移动的速度
    }

    /**
     * Bricks类
     * @param {[type]} row 砖块的行数
     * @param {[type]} col 砖块的列数
     */
    var Bricks=function(row,col){
        'use strict'
        this.row=row;//砖块的行数
        this.col=col;//砖块的列数
        this.num=row*col;
        this.padding=1;//砖块之间的距离，留下的空隙
        this.width=(width/col)-this.padding;//砖块的宽度
        this.height=30;
        
        this.exists=new Array(this.row);//布尔型二维数组，保存砖块是否被打掉
        for(var i=0;i<this.col;i++){
            this.exists[i]=new Array(this.col);
            for(var j=0;j<this.col;j++)
                this.exists[i][j]=1;
        }
    }

    //进行舞台的初始化工作
    Stage.prototype.run=function(){
        this.bindListeners();//绑定监听器

        var _this=this
        this.st=setInterval(function(){//clearInterval时候用得到
            _this.nextFrame();
        },25)
    }
    /**
     * setInerval里面调用的函数，负责绘制每一帧
     * @return {[type]}
     */
    Stage.prototype.nextFrame=function(){
        this.clear();

        this.bricks.draw();
        this.paddle.draw();
        this.ball.draw();

        this.collisionDetect();
        this.detectHitBricks();

        this.ball.move();
        this.paddle.move();

        this.speedUp();
        
    }
    //舞台绑定监听器
    Stage.prototype.bindListeners=function(){
        document.addEventListener('keydown',function(e){
            var keyNum=window.event?e.keyCode:e.which;
            switch(keyNum){
                case 39:rd=true;break;//右方向键
                case 37:ld=true;break;//左方向键
                case 32:pause=!pause;//空格键控制暂停
            }
            // console.log(ld,rd)
        },false)
        document.addEventListener('keyup',function(e){
            var keyNum=window.event?e.keyCode:e.which;
            switch(keyNum){
                case 39:rd=false;break;//右方向键
                case 37:ld=false;break;//左方向键
            }
            // console.log(ld,rd)
        },false)
    }
    Stage.prototype.clear=function(){
        context.clearRect(0,0,width,height)
    }
 
    Stage.prototype.collisionDetect=function(){
        if(this.ball.x+this.ball.radius> width||    
            this.ball.x-this.ball.radius <0) //撞击两侧的墙
            this.ball.dx=-this.ball.dx
        if(this.ball.y-this.ball.radius<0)    //撞击上墙
            this.ball.dy=-this.ball.dy 
        /**
         * TODO：挡板侧面碰到球以后怎么办
         *球和挡板接触后的反弹,做的还不是很自然
         * 
         */
        if(this.ball.y+this.ball.radius>
        height-this.paddle.height*0.5){         
            this.paddle.posX-this.ball.radius<=this.ball.x &&
            this.ball.x<=this.paddle.posX+this.paddle.width+this.ball.radius
            ? this.ball.dy=-this.ball.dy : this.stop("Game Over");
        }         
    }
    /**
     * [stop description]
     * @param  {[type]} str 显示的字符串，分为失败与成功两种情况。
     * @param  {[type]} f   回调函数
     * @return {[type]}     [description]
     */
    Stage.prototype.stop=function(str){
        context.font="30px Verdana";
        // 创建渐变
        var gradient=context.createLinearGradient(0,0,width,0);
        gradient.addColorStop("0","magenta");
        gradient.addColorStop("0.5","blue");
        gradient.addColorStop("1.0","red");
        // 用渐变填色
        context.fillStyle=gradient;
        context.fillText(str,220,380);

        clearInterval(this.st);
        stop_callBack();
    }
    //TODO:检测球是否和砖块发生碰撞。若碰撞则将该砖块的存在值置为0，并且球反弹
    Stage.prototype.detectHitBricks=function(){
        var scaleX=this.bricks.width+this.bricks.padding;//衡量横轴的尺度
        var scaleY=this.bricks.height+this.bricks.padding;//衡量纵轴的尺度
        var col = Math.floor(this.ball.x/scaleX);
        var row = Math.floor(this.ball.y/scaleY);
        //这里实际做的是：圆心若移动到某方块中，才去掉此方块
        if(this.bricks.exists[row]!==undefined && 
            this.bricks.exists[row][col]!==undefined &&
             this.bricks.exists[row][col] == 1){
            // console.log(row,col);
            this.ball.dy=-this.ball.dy;
            this.bricks.exists[row][col]=0;
            this.bricks.num--;//现有的砖块数减一
            if(this.bricks.num==0){
                this.stop("You Win!")
            }
        }

    }
    //砖块数越少，ball的dx、dy要增加
    Stage.prototype.speedUp=function(){
        var speedIncreasement=(this.bricks.row-Math.ceil(this.bricks.num/this.bricks.col))*0.001;
        // console.log('speed:',Math.abs(this.ball.dx), Math.abs(this.ball.dy))
        this.ball.dx>0?(this.ball.dx += speedIncreasement):(this.ball.dx -= speedIncreasement);
        this.ball.dy>0?(this.ball.dy += speedIncreasement):(this.ball.dy -= speedIncreasement);
    }
    //生成[small,big]之间的数字
    Stage.prototype.generateRandom=function(small,big){
        if(small>big) return ;
        return small+(big-small)*Math.random();
    }
    //生成球的初始坐标
    Stage.prototype.initialPos=function(){
        var pos={};
        pos.y=this.generateRandom(250,550);
        pos.x=this.generateRandom(100,500);
        return pos;
    }
    Ball.prototype.draw=function(){
        context.beginPath()
        context.fillStyle='#36648B';
        context.arc(this.x,this.y,this.radius,0,Math.PI*2)
        context.closePath()
        context.fill()
    }
    Ball.prototype.move=function(){
        if(!pause){
            this.x =this.x+this.dx;
            this.y =this.y+this.dy;
        }
    }
    Paddle.prototype.draw=function(){
        context.beginPath();
        context.fillStyle='#A0522D';
        context.rect(this.posX,height-this.height,this.width,this.height);
        context.fill();
        context.closePath();
    }
    Paddle.prototype.move=function(){
        if(rd && !pause &&this.posX+this.width<=width)
            this.posX=this.posX+this.dx;
        else if(ld && !pause && this.posX>=0){
            this.posX=this.posX-this.dx;
        }
    }
    Bricks.prototype.draw=function(){
        for(var i=0;i<this.row;i++)
            for(var j=0;j<this.col;j++)
                if(this.exists[i][j]==1){//砖块存在则绘制
                    context.beginPath();
                    context.fillStyle='#8B8B83';
                    context.rect(j*(this.width+this.padding)+this.padding,
                        i*(this.height+this.padding)+this.padding,
                        this.width,this.height);
                    context.fill();
                    context.closePath();
                }
    }
    return Stage;
}()
