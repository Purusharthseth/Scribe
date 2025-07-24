const throttle = (cb, d) => {
    let last=0, timer;
    return function(...args){
        const now = Date.now();
        if(now-last>=d){
            cb(...args);
            last=now;
        } else{
            if(timer) clearTimeout(timer);
            timer = setTimeout(()=>{
                cb(...args);
                last = Date.now();
                timer=null;
            }, d - (now - last));
        }
    }
};
export default throttle;