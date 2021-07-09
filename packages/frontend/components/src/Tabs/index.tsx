import React, { useEffect, useRef, useState } from "react"
import classnames from 'classnames/bind';
import style from './style.module.scss';
const cx = classnames.bind(style)



export const Tabs = ({items, children}) => {

    const ref = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const cards = React.Children.toArray(children)

    useEffect(() => {
        if(!ref.current) return        
        
        ref.current.style.transform = `translateX(-${activeIndex * 100}%)`

    }, [activeIndex])

    return <div className={cx('TabsCards')}>
        <div className={cx('Tabs')}>
            {items.map((item, index) => 
                <label key={index} onClick={() => setActiveIndex(index)} className={cx({active: activeIndex === index})} htmlFor={item.id}>
                    {item.label}
                </label>)}           
        </div>
        <div ref={ref} className={cx('Cards')}>
                {cards.map((card, index) => <div key={index} className={cx({active: activeIndex === index})}>{card}</div>)}
            </div>
        
    </div>
}