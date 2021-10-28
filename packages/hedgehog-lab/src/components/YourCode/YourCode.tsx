import React, {Dispatch, SetStateAction, useState} from 'react';
import {Button, Card, CardContent, ClickAwayListener} from '@mui/material';
import {ControlledEditor, ControlledEditorOnChange, monaco} from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import {queryCache} from 'react-query';
import ResizeObserver from 'react-resize-detector';
import SaveButton from "./SaveButton";
import UploadButton from "./UploadButton";
import {FiberManualRecord, PlayCircleOutline, StopCircleOutlined} from "@mui/icons-material";
import {usePageLeave} from "react-use";

const COMPILE_AND_RUN_BUTTON_ID = 'compile-and-run-button-id';

interface YourCodeProps {
    handleCompileAndRun: (event: React.MouseEvent) => void;
    source: string;
    loading: boolean;
    setSource: Dispatch<SetStateAction<string>>;
    getLocalCodeList: () => void;
    handleLoadFile: (str: string) => void;
}

monaco.init().then(monaco =>
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSyntaxValidation: true,
        noSemanticValidation: true
    })).catch(error => console.error('An error occurred during initialization of Monaco: ', error));

const YourCode: React.FC<YourCodeProps> = (props: YourCodeProps) => {
    const {handleCompileAndRun, loading, setSource, source, getLocalCodeList, handleLoadFile} = props;

    const [editor, setEditor] = useState<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
    const [monaco, setMonaco] = useState<typeof monacoEditor | null>(null);

    const [codeSavingFlag, setCodeSavingFlag] = useState(false)

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // save code to local storage
    usePageLeave(() => autoSaveCode());
    const autoSaveCode = () => {
        sleep(100).then(() => {
            localStorage.setItem('lastRunningCode', source as string)
            setCodeSavingFlag(false)
        })
    }

    const handleUploadSource: ControlledEditorOnChange = (e, v) => {
        setSource(v as string);
        setCodeSavingFlag(true)
    };

    const options = {
        wordWrap: 'on' as const,
        scrollBeyondLastLine: false,
    };


    const handleEditorDidMount = (
        _: () => string,
        editor: monacoEditor.editor.IStandaloneCodeEditor,
    ) => {
        editor.addAction({
            id: COMPILE_AND_RUN_BUTTON_ID,
            label: 'compile-and-run-butt-label',
            keybindings: [2051], // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.Enter == 2051
            run: () => {
                document.getElementById(COMPILE_AND_RUN_BUTTON_ID)?.click();
            }
        });
        setEditor(editor);
    };

    return (
        <div style={{height: '100%'}}>
            <Card sx={{height: '100%', borderRadius: 0}}>
                <CardContent sx={{display: 'flex', alignContent: 'center', justifyContent: 'space-between'}}>
                    <Button size={'small'} variant={'outlined'} endIcon={
                        codeSavingFlag && (<FiberManualRecord/>)
                    }>
                        Your Code
                    </Button>

                    <div>
                        <UploadButton handleLoadFile={handleLoadFile}/>
                        <SaveButton getLocalCodeList={getLocalCodeList} source={source}/>
                        {loading ? (
                            <Button
                                endIcon={<StopCircleOutlined/>}
                                variant="contained"
                                color="error"
                                size="small"
                                style={{
                                    textTransform: 'none',
                                }}


                                onClick={() => {
                                    // stop the web-worker
                                    queryCache.cancelQueries(['compiler']);
                                    // set result to initial state
                                    queryCache.setQueryData(['compiler', source], (data) => ({
                                        outputItem: [],
                                        outputString: ''
                                    }));
                                }}>
                                Stop
                            </Button>
                        ) : (
                            <Button
                                endIcon={<PlayCircleOutline/>}
                                id={COMPILE_AND_RUN_BUTTON_ID}
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={(e) => handleCompileAndRun(e)}
                                style={{
                                    textTransform: 'none'
                                }}>
                                Run
                            </Button>
                        )}
                    </div>
                </CardContent>


                <CardContent>
                    <ClickAwayListener onClickAway={autoSaveCode}>
                        <ResizeObserver
                            onResize={(width, height) => {
                                if (editor) {
                                    editor.layout();
                                    source
                                }
                            }}>
                            <div
                                style={{
                                    height: 'calc(100vh - 160px)'

                                }}>

                                <ControlledEditor
                                    language="javascript"
                                    value={source}
                                    onChange={handleUploadSource}
                                    options={options}
                                    editorDidMount={handleEditorDidMount}
                                />
                            </div>
                        </ResizeObserver>
                    </ClickAwayListener>

                </CardContent>
            </Card>
        </div>
    );
};

export default YourCode;
