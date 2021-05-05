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
    switch(action.type) {
        case 'LIST':
            return {...state, listed: true, rect: action.payload.rect, }
        case 'COLLAPSE':
            return {...state, listed: false}
        case 'SELECT':
            return {...state, listed: false, value: action.value}

        case 'REOPTION':
                return {...state, options: action.options, defaultValue: action.defaultValue, value: action.value}
            default:
                return state
    }
}


const init = ({name, ...rest}) => ({
    id: `${name}_${Math.random().toString(36).slice(-5)}`, 
    ...rest,     
    listed: false})

export default ({children, name, ...props}) => {

    const [state, dispatch] = useReducer(selectReducer, {...props}, init)

    const {defaultValue, value, options} = props

    useEffect(() => dispatch({type: 'REOPTION', defaultValue, value, options}), [defaultValue, value, options])

    return <SelectContext.Provider value={[state, dispatch]}>
        {children}
    </SelectContext.Provider>
}