import React, { useRef, useEffect, useState, useMemo } from 'react';
import style from './style.module.scss';
import classnames from 'classnames/bind';

const cx = classnames.bind(style);

const EditorActionsMenu = ({range, setIamIjectingLink, setReplacement}) => {

  const [link, setLink] = useState<{mode: boolean, url: string}>({mode: false, url: ''})

  if(!range) {
    if(link.mode) setLink({...link, mode: false})
    return null
  }

  const position = range.getBoundingClientRect()
  const {left, width, top} = position

  const startLinking = () => {
    setLink({...link, mode: true}); 
    setIamIjectingLink(true)
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
    const parent = document.createElement('i');
    parent.appendChild(range.extractContents())
    range.insertNode(parent)
    setReplacement(range)
  }
  const setBold = (e) => {
    e.preventDefault()
    const parent = document.createElement('b');
    parent.appendChild(range.extractContents())
    range.insertNode(parent)

    setReplacement(range)
  }
  const setUnderline = (e) => {
    e.preventDefault()
    const parent = document.createElement('u');
    parent.appendChild(range.extractContents())
    range.insertNode(parent)

    setReplacement(range)
  }
  

  return (<div className="editor_actions_menu" onClick={e => e.stopPropagation()} style={{position:'fixed', left: left + width, top}}>
    {!link.mode 
    ?
    <ul>
      <li><button onClick={startLinking}>Link</button></li>
      <li><button onClick={setItalic}>Italic</button></li>
      <li><button onClick={setBold}>Bold</button></li>
      <li><button onClick={setUnderline}>Underline</button></li>
    </ul>
    : <fieldset>
        <label htmlFor="link">URL</label>
        <input name="link" id="link" onChange={e => setLink({...link, url: e.target.value})} />
        <button onClick={injectLink}>insert button</button>
      </fieldset>
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
 
  const ContentEditor = useMemo(() => 
    <div ref={contentRef} 
        contentEditable 
        onInput={onInput} 
        dangerouslySetInnerHTML={{__html: html}} />, [])
 

  return <>    
    <div className={cx("Editor")}>
      {ContentEditor}
      <Textarea name={name} className={cx({debug})} editorInnerHTML={editorInnerHTML} />
    </div>
    <EditorActionsMenu {...{...selection, setIamIjectingLink, setReplacement}} />
  </>

}


const firstLineContent = /^(?<content>.*?)<div>/g
const breakedContent = /(<div><br><\/div>)/g
const plainContent = /<div>(?<content>.*?)<\/div>/g
const spannedContent = /(<span .*?>)(?<content>.*?)(<\/span>)/g
const uContent = /(<u.*?>)(?<content>.*?)(<\/u>)/g
const bContent = /(<b.*?>)(?<content>.*?)(<\/b>)/g
const iContent = /(<i.*?>)(?<content>.*?)(<\/i>)/g



const Textarea = ({name, className, editorInnerHTML}) => {
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