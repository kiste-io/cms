import React, { useRef, useEffect, useState, useMemo } from 'react';
import style from './style.module.scss';
import classnames from 'classnames/bind';
import {Button, ButtonGroup, Icon} from '..'
import Portal from '../Portal';

const cx = classnames.bind(style);


const removeTag = (range, nodeName, anchorNode, anchorParentNodeName, anchorOffset, focusOffset, attr?) => {
  const [startOffset, endOffset] = [anchorOffset, focusOffset].sort((a, b) => a-b)
  const {parentElement} = anchorNode
  const chars = parentElement.innerText
  const before = chars.substr(0, startOffset)
  const voi = chars.substr(startOffset, endOffset - startOffset)
  const after = chars.substr(endOffset)

  var fragment = document.createDocumentFragment();

  if(before.length > 0) {
    const u = document.createElement(nodeName);
    const bt = document.createTextNode(before);
  
    u.appendChild(bt)
    attr && attr(u)
    fragment.appendChild(u)        
  }
  
  const voit = document.createTextNode(voi)
  fragment.appendChild(voit)

  if(after.length > 0) {
    const u2 = document.createElement(nodeName);
    const u2t = document.createTextNode(after)
    u2.appendChild(u2t)
    attr && attr(u2)

    fragment.appendChild(u2)
  }

  
  parentElement.parentElement.replaceChild(fragment, parentElement)
}

const manipulateString = (range, nodeName, anchorNode, anchorParentNodeName, anchorOffset, focusOffset, attr?) => {

  if(anchorParentNodeName === nodeName.toUpperCase()){
    removeTag(range, nodeName, anchorNode, anchorParentNodeName, anchorOffset, focusOffset, attr)
  }else {
    const parent = document.createElement(nodeName);
    parent.appendChild(range.extractContents())
    range.insertNode(parent)
    
  }
}

const EditorActionsMenu = ({range, setIamIjectingLink, setReplacement}) => {

  const [link, setLink] = useState<{mode: boolean, url: string}>({mode: false, url: ''})
  const linkInputRef = useRef()

  useEffect(() => {
    if(!linkInputRef.current) return

    const clickListener = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const ref = linkInputRef.current as any
      
      console.log('ref && !ref.contains(target)', ref, !ref.contains(target))
      if(ref && !ref.contains(target)) {
         // remove
         document.getSelection().removeAllRanges();
         setIamIjectingLink(false)
         setLink({...link, mode: false})
      }
      
  }

    document.addEventListener('click', clickListener)
    return () => document.removeEventListener('click', clickListener);

  }, [linkInputRef.current, link])

  if(!range) {
    if(link.mode) setLink({...link, mode: false})
    return null
  }



  const position = range.getBoundingClientRect()
  const {left, width, top} = position

  const startLinking = (e) => {
    e.preventDefault()

    if(anchorParentNodeName === 'A'){
      removeTag(range, 'a', anchorNode, anchorParentNodeName, anchorOffset, focusOffset, (anchor) => anchor.href = link.url )
    }else {
      setLink({...link, mode: true}); 
      setIamIjectingLink(true)
    }    
  }

  const injectLink = (e) => {
    e.preventDefault()

    const parent = document.createElement(`a`)
    parent.href = link.url
    parent.appendChild(range.extractContents())
    range.insertNode(parent)

    setReplacement(range)
    setIamIjectingLink(false)

  }
  
  const setItalic = (e) => {
    e.preventDefault()
    manipulateString(range, 'i', anchorNode, anchorParentNodeName, anchorOffset, focusOffset)
    setReplacement(range)
  }

  const setBold = (e) => {
    e.preventDefault()

    manipulateString(range, 'b', anchorNode, anchorParentNodeName, anchorOffset, focusOffset)
    setReplacement(range)
  }
  const setUnderline = (e) => {

    e.preventDefault()

    manipulateString(range, 'u', anchorNode, anchorParentNodeName, anchorOffset, focusOffset)
    setReplacement(range)

    
  }
  
  const {anchorNode, anchorOffset, focusOffset} = document.getSelection()

  const anchorParentNodeName = anchorNode?.parentNode.nodeName

  const isDisabled = (nodeName) => {
    return !['A', 'U', 'B', 'I'].includes(nodeName) || (anchorParentNodeName !== nodeName && ['A', 'U', 'B', 'I'].includes(anchorParentNodeName))
  }

  return (<div className={cx('EditorActionsMenu')} onClick={e => e.stopPropagation()} style={{position:'fixed', left: left + width, top}}>
    {!link.mode 
    ?<ButtonGroup>
        <Button size="small" disabled={isDisabled('A')} active={anchorParentNodeName === 'A'}  onClick={!isDisabled('A') && startLinking}><Icon.Link height="18" width="18" /></Button>

        <Button size="small"  disabled={isDisabled('I')} active={anchorParentNodeName === 'I'}  onClick={!isDisabled('I') && setItalic} ><Icon.Italic height="18" width="18" /></Button>

        <Button size="small" disabled={isDisabled('B')} active={anchorParentNodeName === 'B'}  onClick={!isDisabled('B') && setBold} ><Icon.Bold height="18" width="18" /></Button>

        <Button size="small"disabled={isDisabled('U')} active={anchorParentNodeName === 'U'} onClick={!isDisabled('U') && setUnderline}><Icon.Underline height="18" width="18"/></Button>

      </ButtonGroup>
    : <span ref={linkInputRef}><ButtonGroup>
        <input  name="link" id="link" autoFocus onChange={e => setLink({...link, url: e.target.value})} placeholder="https://" />
        <Button as="span" size="small" onClick={injectLink}><Icon.Add /></Button>
      </ButtonGroup>
      </span>
    }
  </div>)
}


export const Editor = ({name, html = '', debug = false}) => {

  const [editorInnerHTML, setEditorInnerHTML] = useState<string>(html)
  const [selection, setSelection] = useState<{range: Range}>({range: null})
  const [iamIjectingLink, setIamIjectingLink] = useState(false)
  const [replacement, setReplacement] = useState(null)
  const contentRef = useRef() 
  

  useEffect(() => {

    const selectionChange = (e) => {
      
      
      const selection = document.getSelection()
      

      if(!iamIjectingLink) {
        e.target.activeElement === contentRef.current && selection.type === "Range"
        ? setSelection({range: selection.getRangeAt(0).cloneRange()})
        : setSelection({range: null})
      }
      
        
    }

    document.addEventListener('selectionchange', selectionChange)
    return () => document.removeEventListener('selectionchange', selectionChange)

  }, [iamIjectingLink])


  useEffect(() => {

    if(!replacement) return 

    // theorie https://javascript.info/selection-range
    // example https://stackoverflow.com/questions/5393922/javascript-replace-selection-all-browsers
   
    document.getSelection().removeAllRanges(); // clear existing selection if any
    document.getSelection().addRange(replacement);
    
  
    setEditorInnerHTML((contentRef.current as HTMLDivElement).innerHTML)

  }, [replacement])

  const onInput = (e) => {
    setEditorInnerHTML((e.target as HTMLDivElement).innerHTML)
  }

  useEffect(() => {
    setEditorInnerHTML(html)
  }, [html])
 
  const ContentEditor = useMemo(() => 
    <div tabIndex={0} ref={contentRef} 
        contentEditable 
        onInput={onInput} 
        dangerouslySetInnerHTML={{__html: html}} />, [html])
 

  return <>    
    <div className={cx("Editor")}>
      {ContentEditor}
      <NativeTextarea name={name} className={cx({debug})} editorInnerHTML={editorInnerHTML} />
    </div>
    <Portal>
        <EditorActionsMenu {...{...selection, setIamIjectingLink, setReplacement}} />
    </Portal>
  </>

}


const firstLineContent = /^(?<content>.*?)<div>/g
const breakedContent = /(<div><br><\/div>)/g
const plainContent = /<div>(?<content>.*?)<\/div>/g
const spannedContent = /(<span .*?>)(?<content>.*?)(<\/span>)/g
const uContent = /(<u\s.*?>)(?<content>.*?)(<\/u>)/g
const bContent = /(<b\s.*?>)(?<content>.*?)(<\/b>)/g
const iContent = /(<i\s.*?>)(?<content>.*?)(<\/i>)/g



const NativeTextarea = ({name, className, editorInnerHTML}) => {

  const html = (editorInnerHTML || '')
  .replace(firstLineContent, "<p>$<content></p><div>")
  .replace(breakedContent, "<br>")
  .replaceAll(plainContent, "<p>$<content></p>")
  .replaceAll(spannedContent, "$<content>")
  .replaceAll(uContent, "<u>$<content></u>")
  .replaceAll(bContent, "<b>$<content></b>")
  .replaceAll(iContent, "<i>$<content></i>")
  .replaceAll(/(<p><\/p>)/g, "")

  return <textarea readOnly className={className} name={name} value={html}></textarea>
}




export const Textarea = ({id, name, label, defaultValue=""}) => {

  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // The value of the textarea
  const [value, setValue] = useState<String>('');

  // This function is triggered when textarea changes
  const textAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [value]);

  return (
    <div className={cx('Textarea')}>
     
      <textarea
        name="comment"
        ref={textareaRef}
        className={cx(value.length ? 'filled' : '')} 
        onChange={textAreaChange}
      >
        {value}
      </textarea>
      {label && <label onClick={() => textareaRef?.current.focus()} htmlFor={id}>{label}</label>} 
    </div>
  );
}