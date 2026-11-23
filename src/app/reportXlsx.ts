// Self-contained spreadsheet writer: no npm dependency, no runtime network requests.
// Creates XLSX with the exact 10 visible columns of the existing daily attendance sheet.
// ZIP entries use the standard STORE method and CRC-32.
export type AttendanceExportRecord = {
  no:number; name:string; rank:string;
  previousStart:string; previousEnd:string;
  plannedStart:string; plannedEnd:string;
  note:string; lunch:boolean; dinner:boolean;
};
const xml=(s:unknown)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const col=(index:number)=>{let out='';for(let n=index;n>0;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out;};
const cell=(address:string,text:unknown,style=0)=>`<c r="${address}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(text)}</t></is></c>`;
const row=(index:number,parts:string[],height=22)=>`<row r="${index}" ht="${height}" customHeight="1">${parts.join('')}</row>`;
const enc=new TextEncoder();
const u16=(x:number)=>[x&255,(x>>>8)&255];
const u32=(x:number)=>[x&255,(x>>>8)&255,(x>>>16)&255,(x>>>24)&255];
const crcTable=Array.from({length:256},(_,n)=>{let v=n;for(let i=0;i<8;i++)v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);return v>>>0;});
const crc32=(bytes:Uint8Array)=>{let v=0xffffffff;for(const x of bytes)v=crcTable[(v^x)&255]^(v>>>8);return (v^0xffffffff)>>>0;};
function zipStore(entries:{name:string;data:string}[]):Blob{
  const parts:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
  for(const entry of entries){
    const name=enc.encode(entry.name),data=enc.encode(entry.data),crc=crc32(data);
    const local=Uint8Array.from([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
    parts.push(local,data);
    central.push(Uint8Array.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]));
    offset+=local.length+data.length;
  }
  const centralLength=central.reduce((s,x)=>s+x.length,0);
  const end=Uint8Array.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralLength),...u32(offset),...u16(0)]);
  return new Blob([...parts,...central,end] as BlobPart[],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export function makeAttendanceWorkbook(date:string,previousDate:string,records:AttendanceExportRecord[]):Blob{
  const headerFill='E3EFDC';
  // fonts: normal, bold, date, red note; fills: none, pale green, yellow.
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/><color rgb="FF164C32"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/><color rgb="FFFF0000"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${headerFill}"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf xfId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="center"/></xf><xf xfId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="center" wrapText="1"/></xf><xf xfId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="center"/></xf><xf xfId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="left"/></xf><xf xfId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="center"/></xf><xf xfId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="center"/></xf><xf xfId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="left"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const r1=row(1,[cell('A1','',1),cell('B1','',1),cell('C1','기준일:',1),cell('D1',date,2),cell('E1','',1),cell('F1','',1),cell('G1','',1),cell('H1','',1),cell('I1','식수인원',1),cell('J1','',1)],24);
  const r2=row(2,[cell('A2','No',1),cell('B2','성명',1),cell('C2','직급',1),cell('D2',`${previousDate} (전일확정)`,1),cell('E2','',1),cell('F2',`${date} (당일예정)`,1),cell('G2','',1),cell('H2','연장/휴근 내용',1),cell('I2','당일',1),cell('J2','',1)],28);
  const r3=row(3,[cell('A3','',1),cell('B3','',1),cell('C3','',1),cell('D3','출근',1),cell('E3','퇴근',1),cell('F3','출근',1),cell('G3','퇴근',1),cell('H3','',1),cell('I3','중식',1),cell('J3','석식',1)],22);
  const body=records.map((p,i)=>{
    const n=i+4;const vals=[p.no,p.name,p.rank,p.previousStart,p.previousEnd,p.plannedStart,p.plannedEnd,p.note,p.lunch?'1':'',p.dinner?'1':''];
    const leave=/(무급휴가|연차|반차|휴무|휴근)/.test(p.note);
    return row(n,vals.map((val,j)=>cell(`${col(j+1)}${n}`,val,leave&&j>=3&&j<=6?4:j===7&&p.note?3:0)),21);
  });
  const totalRow=records.length+4;
  const end=row(totalRow,[cell(`A${totalRow}`,'',1),cell(`B${totalRow}`,'',1),cell(`C${totalRow}`,'',1),cell(`D${totalRow}`,'',1),cell(`E${totalRow}`,'',1),cell(`F${totalRow}`,'',1),cell(`G${totalRow}`,'',1),cell(`H${totalRow}`,'식수 합계',1),cell(`I${totalRow}`,records.filter(x=>x.lunch).length,5),cell(`J${totalRow}`,records.filter(x=>x.dinner).length,5)],23);
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:J${totalRow}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="21"/><cols><col min="1" max="1" width="6" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="15" customWidth="1"/><col min="4" max="7" width="12" customWidth="1"/><col min="8" max="8" width="38" customWidth="1"/><col min="9" max="10" width="7" customWidth="1"/></cols><sheetData>${r1}${r2}${r3}${body.join('')}${end}</sheetData><mergeCells count="9"><mergeCell ref="A2:A3"/><mergeCell ref="B2:B3"/><mergeCell ref="C2:C3"/><mergeCell ref="D2:E2"/><mergeCell ref="F2:G2"/><mergeCell ref="H2:H3"/><mergeCell ref="I1:J1"/><mergeCell ref="I2:J2"/><mergeCell ref="D1:G1"/></mergeCells><pageMargins left="0.2" right="0.2" top="0.3" bottom="0.3" header="0.1" footer="0.1"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="1"/></worksheet>`;
  const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="일일 근태관리" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
  return zipStore([{name:'[Content_Types].xml',data:contentTypes},{name:'_rels/.rels',data:rootRels},{name:'xl/workbook.xml',data:workbook},{name:'xl/_rels/workbook.xml.rels',data:rels},{name:'xl/styles.xml',data:styles},{name:'xl/worksheets/sheet1.xml',data:sheet}]);
}
