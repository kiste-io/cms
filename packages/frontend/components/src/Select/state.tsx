import React, { useContext, useReducer, useEffect } from 'react';


interface Option {
    value: string,
    label: string,
}

interface Rect {
    top: string,
    left: string,
    width: string
}

interface SelectConextsState {
    id?: string,
    name?: string,
    listed?: boolean,
    label?: string,
    options?: Option[],
    defaultValue?: string,
    value?: string,
    rect?: Rect,
    onChange?: (value: string) => void
    
}

const SelectContext: React.Context<[SelectConextsState, React.Dispatch<any>]> = React.createContext([{}, (action: any) => {}])

export const useSelectContext = () => useContext(SelectContext)

const selectReducer = (state, action) => {
    console.log('select', action.type, state)
    switch(action.type) {
        case 'LIST':
            return {...state, listed: true, rect: action.payload.rect, }
        case 'COLLAPSE':
            return {...state, listed: false}
        case 'SELECT':
            return {...state, listed: false, value: action.value}

        case 'REOPTION':
                return {...state, options: action.options, defaultValue: action.defaultValue}
            default:
                return state
    }
}


const init = ({name, ...rest}) => ({
    id: `${name}_${Math.random().toString(36).slice(-5)}`, 
    ...rest,     
    listed: false})


const optionsNotEqual = (options1, options2) => {
    const options1Values = options1.map(o => o.value)
    const options2Values = options2.map(o => o.value)
   
    return options1Values.filter(v => !options2Values.includes(v)).length > 0 || options2Values.filter(v => !options1Values.includes(v)).length > 0
}

export default ({children, name, ...props}) => {

    const [state, dispatch] = useReducer(selectReducer, {...props}, init)

    const {defaultValue, options} = props

    useEffect(() => {
        console.log(' optionsNotEqual', optionsNotEqual(options,state.options ), options,state.options)
        if(defaultValue !== state.defaultValue || optionsNotEqual(options,state.options )){
            dispatch({type: 'REOPTION', defaultValue, options})
        }
        
    }, [defaultValue, options])

    return <SelectContext.Provider value={[state, dispatch]}>
        {children}
    </SelectContext.Provider>
}