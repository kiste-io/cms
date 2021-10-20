import React, { useContext, useReducer, useEffect, useRef } from 'react';


interface Option {
    value: string,
    label: string,
    hidden: boolean,
    temp: boolean
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
    small?: boolean,
    input?: boolean,
    inputValue?: string,
    rect?: Rect,

    onChange?: ({value, label}) => void
    
}

const SelectContext: React.Context<[SelectConextsState, React.Dispatch<any>]> = React.createContext([{}, (action: any) => {}])

export const useSelectContext = () => useContext(SelectContext)

const selectReducer = (state, action) => {

    const getStateValue = () => {
        const temp = state.options.find(o => o.temp)
        let c_value = state.value;
        if(temp && temp.label === "") {
            c_value = null
        }else if (temp && temp.label !== "") {
            const existingOption = state.options.find(o => !o.temp && (o.label.toLowerCase() === temp.label.toLowerCase()))

            c_value = existingOption?.value || temp.value
        }
        return c_value
    }

    const validOption = (option) => {
        if(!option.temp) return true

        if (option.label === '') return false

        const existingOption = state.options.find(o => !o.temp && (o.label.toLowerCase() === option.label.toLowerCase()))

        if(existingOption?.label) return false

        return true
    }
    
    const prefix = state.name.toUpperCase()
    console.log('action', action)
    switch(action.type) {
        case `${prefix}_LIST`:
            return {...state, listed: true }
        case `${prefix}_COLLAPSE`:
            
            const c_value = getStateValue()
            const c_options = state.options.filter(validOption).map(o => ({...o, hidden: false}))
            return {...state, listed: false, options: c_options, value: c_value}
        
        case `${prefix}_SELECT`:           
            const s_options = state.options.filter(o => !o.temp).map(o => ({...o, hidden: false}))

            return {...state, listed: false, value: action.value, options: s_options}
        case `${prefix}_REOPTION`:
            // exclude values not existing in an options
            const defaultValue = action.options.find(o => o.value === action.defaultValue)?.value
            const value = action.options.find(o => o.value === state.value)?.value
            return {...state, options: action.options, defaultValue, value, onChange: action.onChange}
        case `${prefix}_HIDE_OPTIONS`:
            const hide_options = action.options.map(o => o.value)
            const h_options = state.options
                .filter(o => !o.temp)
                .map(o => hide_options.includes(o.value) && ({...o, hidden: true}) || ({...o, hidden: false}))
            return {...state, 
                    options: [
                        ...h_options, 
                        {temp: true, hidden: true, label: action.label, value: state.inputValue || `input_temp_value_${Math.random().toString(36).substr(2, 9)}`} 
                    ]}

        default:
            return state
    }


    
}


const init = ({name, options, ...rest}) => ({
    id: `${name}_${Math.random().toString(36).slice(-5)}`, 
    name,
    options: options || [],
    ...rest,     
    listed: false})


const optionsNotEqual = (options1=[], options2=[]) => {
    const options1Values = options1.map(o => o.value)
    const options2Values = options2.map(o => o.value)
   
    return options1Values.filter(v => !options2Values.includes(v)).length > 0 || options2Values.filter(v => !options1Values.includes(v)).length > 0
}

export default ({children, ...props}) => {

    const ref = useRef()
    const [state, dispatch] = useReducer(selectReducer, {...props, ref}, init)

    const {defaultValue, value, options, onChange} = props

    useEffect(() => {
        if(defaultValue !== state.defaultValue || optionsNotEqual(options,state.options )){
            dispatch({type: `${state.name.toUpperCase()}_REOPTION`, defaultValue, options, onChange})
        }
        
    }, [defaultValue, value, options, onChange])
    
    /** native html support for onChange Event */    
    useEffect(() => {
        if(!ref.current || !state.value) return
        
        const select = (ref.current as HTMLBaseElement).querySelector('select')
        select.value = state.value;
        select.dispatchEvent(new Event('change'));           

    }, [state.value])
    
    return <SelectContext.Provider value={[state, (action) => dispatch(({...action, type: `${state.name.toUpperCase()}_${action.type}`}))]}>
        <div ref={ref}>
            {children}
        </div>
    </SelectContext.Provider>
}