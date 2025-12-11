const PATH_IMAGESET_XML = 'data/Interface/Common/';
const PATH_TEXTURE_FILES = 'data/Material/';
var filterImageSets = ""
const Auto_SCALE_FACTOR = false
const Global_typePropertyMap = {
  DefaultWindow: [
    "AbsolutePosition",
    "AbsoluteSize",
    "AlwaysOnTop",
    "BackImage",
    "Position",
    "RiseOnClick",
    "Size",
    "Text",
    "UnifiedPosition",
    "UnifiedSize",
    "Visible",
  ],
  TLBB_MainFrameNULL: [
    "AttachEnabled",
    "MouseHollow",
    "MouseLButtonHollow",
    "MouseMoveHollow",
    "MouseRButtonHollow",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_MainFrame3: ["UnifiedPosition", "UnifiedSize"],
  TLBB_DragTitle: [
    "AbsolutePosition",
    "AlwaysOnTop",
    "DragTarget",
    "Font",
    "HorzFormatting",
    "Text",
    "TextColor",
    "Tooltip",
    "UnifiedSize",
    "VertFormatting",
  ],
  TLBB_SimpleText: [
    "AlwaysOnTop",
    "Font",
    "HorzFormatting",
    "Position",
    "RiseOnClick",
    "Size",
    "Text",
    "TextColor",
    "Tooltip",
    "UnifiedPosition",
    "UnifiedSize",
    "VertFormatting",
    "Visible",
  ],
  TLBB_ButtonHelp: ["AbsoluteSize", "UnifiedPosition"],
  TLBB_ButtonClose: ["AbsoluteSize", "UnifiedPosition"],
  TLBB_ActionButton: [
    "AbsolutePosition",
    "AbsoluteSize",
    "BackImage",
    "DragAcceptName",
    "DraggingEnabled",
    "Empty",
    "Tooltip",
  ],
  TLBB_StaticImageNULL: [
    "AlwaysOnTop",
    "Image",
    "MouseHollow",
    "MouseHollow",
    "MouseLButtonHollow",
    "MouseMoveHollow",
    "MouseRButtonHollow",
    "Position",
    "RiseOnClick",
    "Size",
    "TextColor",
    "UnifiedPosition",
    "UnifiedSize",
    "Visible",
  ],
  TLBB_ButtonNULL: [
    "AlwaysOnTop",
    "DisabledImage",
    "HoverImage",
    "NormalImage",
    "PushedImage",
    "Tooltip",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_FramePlayer: ["UnifiedPosition", "UnifiedSize"],
  TLBB_MeshWindow: [
    "MouseHollow",
    "ShowControl",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_ButtonTurnLeft: ["AbsoluteSize", "UnifiedPosition"],
  TLBB_ButtonTurnRight: ["AbsoluteSize", "UnifiedPosition"],
  TLBB_SimpleMulitiTextFrame: [
    "AbsolutePosition",
    "AbsoluteSize",
    "HorzFormatting",
    "RiseOnClick",
    "Text",
    "TextColor",
    "Tooltip",
    "UnifiedPosition",
    "UnifiedSize",
    "VertFormatting",
  ],
  TLBB_Frame_Lace2: [
    "RiseOnClick",
    "UnifiedPosition",
    "UnifiedSize",
    "Visible",
  ],
  TLBB_Animate: [
    "AlwaysOnTop",
    "Animate",
    "MouseHollow",
    "MouseLButtonHollow",
    "MouseMoveHollow",
    "MouseRButtonHollow",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_ButtonAdd: ["AbsoluteSize", "UnifiedPosition"],
  TLBB_ButtonSub: ["AbsoluteSize", "UnifiedPosition"],
  TLBB_ButtonPageDown: [
    "AbsolutePosition",
    "CheckMode",
    "MouseRButtonHollow",
    "Text",
    "UnifiedPosition",
    "UnifiedSize",
    "Visible",
  ],
  TLBB_StaticImageFrame: ["Image", "UnifiedPosition", "UnifiedSize"],
  TLBB_MainFrame1: ["Text", "UnifiedPosition", "UnifiedSize"],
  TLBB_ButtonCommon: [
    "AbsoluteSize",
    "Text",
    "Tooltip",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_ButtonCommon2: ["AbsoluteSize", "Text", "Tooltip", "UnifiedPosition"],
  TLBB_ButtonCommon3: ["AbsolutePosition", "AbsoluteSize", "Text"],
  TLBB_ButtonCommon4: ["AbsolutePosition", "AbsoluteSize", "Text"],
  TLBB_ButtonExp1: ["AbsolutePosition", "AbsoluteSize", "Text"],
  TLBB_ButtonExp2: ["AbsolutePosition", "AbsoluteSize", "Text"],
  TLBB_ButtonPageUp: [
    "AbsolutePosition",
    "AbsoluteSize",
    "CheckMode",
    "Selected",
    "Text",
  ],
  TLBB_ButtonRadio: ["AbsolutePosition", "AbsoluteSize", "Text"],
  TLBB_Frame_Lace6: ["AbsolutePosition", "AbsoluteSize"],
  TLBB_MainFrame0: [
    "BackImage",
    "RiseOnClick",
    "Text",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_ButtonCheckForRMBShop: [
    "CheckMode",
    "Text",
    "Tooltip",
    "UnifiedPosition",
    "UnifiedSize",
    "Visible",
  ],
  TLBB_ScrollInfoFixedFrame: [
    "MouseHollow",
    "MouseMoveHollow",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_ScrollInfoFixed: [
    "CoolDown",
    "MouseHollow",
    "MouseMoveHollow",
    "MoveSpeed",
    "ScrollTime",
    "UnifiedPosition",
    "UnifiedSize",
  ],
  TLBB_ButtonCheck: ["AbsoluteSize", "CheckMode", "Tooltip", "UnifiedPosition"],
  TLBB_Money: [
    "CopperIcon",
    "GoldIcon",
    "HorzFormatting",
    "MoneyNumber",
    "Position",
    "SilverIcon",
    "Size",
    "Tooltip",
  ],
};
// console.log = function() {};
// Hàm tổng hợp thuộc tính cho từng loại Window từ currentElements

const XMlFileContent = `<?xml version="1.0" ?>
<GUILayout>
	<Window Type="TLBB_MainFrameNULL" Name="SelfEquip_Frame">
		<Property Name="UnifiedSize" Value="{{0.000000,718.000000},{0.000000,402.000000}}"/>
		<Property Name="UnifiedPosition" Value="{{0.000000,0.000000},{0.120000,0.000000}}"/>
		<Property Name="AttachEnabled" Value="False"/>
		<Event Name="Hidden" Function="SelfEquip_CloseUI();" />
		<Window Type="TLBB_MainFrame3" Name="SelfEquip_MainFrame">
			<Property Name="UnifiedSize" Value="{{0.000000,718.000000},{0.000000,402.000000}}"/>
			<Property Name="UnifiedPosition" Value="{{0.000000,0.000000},{0.000000,0.000000}}"/>
			<Window Type="TLBB_DragTitle" Name="SelfEquip_DragTitle">
				<Property Name="AbsolutePosition" Value="x:108.000000 y:11.000000" />
				<Property Name="UnifiedSize" Value="{{1.000000,-133.000000},{0.000000,20.000000}}" />
				<Property Name="DragTarget" Value="SelfEquip_Frame" />
				<Window Type="TLBB_SimpleText" Name="SelfEquip_PageHeader">
					<Property Name="Position" Value="x:0.0 y:0.0" />
					<Property Name="Size" Value="w:1.0 h:1.0" />
					<Property Name="Font" Value="YouYuan9.75"/>
					<Property Name="HorzFormatting" Value="HorzCentred" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="Text" Value="" />
				</Window>
			</Window>
			<Window Type="TLBB_ButtonHelp" Name="SelfEquip_Help">
				<Property Name="UnifiedPosition" Value="{{0.000000,88.000000},{0.000000,14.000000}" />
				<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
				<Event Name="Clicked" Function='Helper:GotoHelper(&quot;*SelfEquip&quot;);' />
			</Window>
			<Window Type="TLBB_ButtonClose" Name="SelfEquip_Close">
				<Property Name="UnifiedPosition" Value="{{1.000000,-19.000000},{0.000000,14.000000}}}" />
				<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
				<Event Name="Clicked" Function="this:Hide();" />
			</Window>
			<Window Type="DefaultWindow" Name="SelfEquip_Frame_Client">
				<Property Name="UnifiedSize" Value="{{1.000000,-17.000000},{1.000000,-60.000000}}"/>
				<Property Name="UnifiedPosition" Value="{{0.000000,10.000000},{0.000000,35.000000}}"/>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_1">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:0.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="Empty" Value="True" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Cap" />
					<Property Name="DragAcceptName" Value="Z1" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 1,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 1,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_701}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_1_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_2">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:34.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="Empty" Value="True" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Shoulder" />
					<Property Name="DragAcceptName" Value="Z2" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 2,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 2,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_328}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_2_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_3">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:68.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="Empty" Value="True" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Wrist" />
					<Property Name="DragAcceptName" Value="Z3" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 3,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 3, 0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_329}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_3_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_4">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:102.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Hand" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z4" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 4,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 4,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_652}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_4_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_5">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:136.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Sash" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z5" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 5,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 5,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_813}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_5_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_6">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:170.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Shot" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z6" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 6,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 6,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_762}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_6_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_7">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:204.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Ring" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z7" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 7,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 7,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_378}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_7_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_8">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:238.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Ring" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z8" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 8,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 8,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_378}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_8_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_9">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:272.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Pifeng" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z9" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 9,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 9,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_326}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_9_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_10">
					<Property Name="AbsolutePosition" Value="x:0.000000 y:306.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Pifeng" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z10" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 10,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 10,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_326}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_10_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_11">
					<Property Name="AbsolutePosition" Value="x:34.000000 y:0.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Weapon" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z11" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 11,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 11,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_722}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_11_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_12">
					<!-- <Property Name="AbsolutePosition" Value="x:68.000000 y:0.000000" /> -->
					<Property Name="AbsolutePosition" Value="x:102.000000 y:0.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Armo" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z12" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 12,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 12,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_327}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_12_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_13">
					<!-- <Property Name="AbsolutePosition" Value="x:102.000000 y:0.000000" /> -->
					<Property Name="AbsolutePosition" Value="x:136.000000 y:0.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Nacket" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z13" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 13,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 13,0 );" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_756}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_13_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_14">
					<!-- <Property Name="AbsolutePosition" Value="x:136.000000 y:0.000000" /> -->
					<Property Name="AbsolutePosition" Value="x:170.000000 y:0.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Anqi" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z14" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 14,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 14,0 );" />
					<Property Name="Tooltip" Value="#{FBSJ_081209_77}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_14_Mask">
						<Property Name="UnifiedSize" Value="{{1.000000,0.000000},{1.000000,0.000000}}"/>
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<Window Type="TLBB_ActionButton" Name="SelfEquip_15">
					<Property Name="UnifiedSize" Value="{{0.000000,34.000000},{0.000000,34.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,68.000000},{0.000000,0.000000}}"/>
					<Property Name="BackImage" Value="set:UIIcons image:Equip_Weapon" />
					<Property Name="Empty" Value="True" />
					<Property Name="DragAcceptName" Value="Z15" />
					<Property Name="DraggingEnabled" Value="True" />
					<Event Name="Clicked" Function="SelfEquip_Equip_Click( 15,1 );" />
					<Event Name="MouseRClick" Function="SelfEquip_Equip_Click( 15,0 );" />
					<Property Name="Tooltip" Value="#{SBFW_20230707_303}" />
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_15_Mask">
						<Property Name="Position" Value="x:0 y:0" />
						<Property Name="Size" Value="w:1 h:1" />
						<Property Name="MouseLButtonHollow" Value="true" />
						<Property Name="MouseRButtonHollow" Value="true" />
						<Property Name="MouseMoveHollow" Value="true" />
						<Property Name="Image" Value="set:Face_04 image:Remind_Bak" />
					</Window>
				</Window>
				<!--END Nguyễn Vinh ADD Long Văn Lệnh Bài-->
				<Window Type="TLBB_ButtonNULL" Name="SelfEquip_Yirong_Icon">
					<Property Name="AbsolutePosition" Value="x:326.000000 y:0.000000" />
					<Property Name="AbsoluteSize" Value="w:34.000000 h:34.000000" />
					<Property Name="Tooltip" Value="#{WGTJ_201222_01}"/>
					<Property Name="PushedImage" Value="set:CommonFrame28 image:YiRong_Pushed"/>
					<Property Name="NormalImage" Value="set:CommonFrame28 image:YiRong_Normal"/>
					<Property Name="HoverImage" Value="set:CommonFrame28 image:YiRong_Hover"/>
					<Property Name="DisabledImage" Value="set:CommonFrame28 image:YiRong_Disabled"/>
					<Event Name="Clicked" Function="SelfEquip_OnYirong();"/>
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Yirong_Icontips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,350.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_FramePlayer" Name="SelfEquip_FakeObject_Frame">
					<Property Name="UnifiedSize" Value="{{0.000000,323.000000},{0.000000,267.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,37.000000},{0.000000,35.000000}}"/>
					<Window Type="TLBB_MeshWindow" Name="SelfEquip_FakeObject">
						<Property Name="UnifiedSize" Value="{{0.000000,318.000000},{0.000000,260.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,3.000000},{0.000000,4.000000}}"/>
						<Property Name="MouseHollow" Value="True" />
						<Property Name="ShowControl" Value="SelfEquip_Frame" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Level">
						<Property Name="UnifiedSize" Value="{{0.300000,18.000000},{0.000000,20.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.020000,2.000000},{0.020000,3.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="HorzCentred" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="AlwaysOnTop" Value="true" />
						<Property Name="Text" Value="#{INTERFACE_XML_114}" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_MenPai">
						<Property Name="UnifiedSize" Value="{{0.400000,90.000000},{0.000000,21.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.500000,-30.000000},{0.020000,3.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="HorzCentred" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="AlwaysOnTop" Value="true" />
						<Property Name="Text" Value="#{INTERFACE_XML_689}" />
					</Window>
					<Window Type="TLBB_ButtonTurnLeft" Name="SelfEquip_Model_TurnLeft">
						<Property Name="UnifiedPosition" Value="{{0.000000,4.000000},{0.900000,0.000000}}" />
						<Property Name="AbsoluteSize" Value="w:25.000000 h:25.000000" />
						<Event Name="MouseButtonDown" Function="SelfEquip_Modle_TurnLeft(1);" />
						<Event Name="MouseButtonUp" Function="SelfEquip_Modle_TurnLeft(0);" />
						<Event Name="CaptureLost" Function="SelfEquip_Modle_TurnLeft(0);" />
					</Window>
					<Window Type="TLBB_ButtonTurnRight" Name="SelfEquip_Model_TurnRight">
						<Property Name="UnifiedPosition" Value="{{0.000000,295.000000},{0.900000,0.000000}}" />
						<Property Name="AbsoluteSize" Value="w:25.000000 h:25.000000" />
						<Event Name="MouseButtonDown" Function="SelfEquip_Modle_TurnRight(1);" />
						<Event Name="MouseButtonUp" Function="SelfEquip_Modle_TurnRight(0);" />
						<Event Name="CaptureLost" Function="SelfEquip_Modle_TurnRight(0);" />
					</Window>
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_IceFastness">
						<Property Name="UnifiedPosition" Value="{{0.3,0.000000},{1.0,-17.000000}}" />
						<Property Name="AbsoluteSize" Value="w:16.000000 h:16.000000" />
						<Property Name="Image" Value="set:UIIcons image:Ice_Repellency_Normal" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_FireFastness">
						<Property Name="UnifiedPosition" Value="{{0.4,0.000000},{1.0,-17.000000}}" />
						<Property Name="AbsoluteSize" Value="w:16.000000 h:16.000000" />
						<Property Name="Image" Value="set:UIIcons image:Fire_Repellency_Normal" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_ThunderFastness">
						<Property Name="UnifiedPosition" Value="{{0.5,0.000000},{1.0,-17.000000}}" />
						<Property Name="AbsoluteSize" Value="w:16.000000 h:16.000000" />
						<Property Name="Image" Value="set:UIIcons image:Thunder_Repellency_Normal" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_PoisonFastness">
						<Property Name="UnifiedPosition" Value="{{0.6,0.000000},{1.0,-17.000000}}" />
						<Property Name="AbsoluteSize" Value="w:16.000000 h:16.000000" />
						<Property Name="Image" Value="set:UIIcons image:Poison_Repellency_Normal" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Energy1_Text">
					<Property Name="AbsolutePosition" Value="x:36.000000 y:302.000000" />
					<Property Name="AbsoluteSize" Value="w:162.000000 h:20.000000" />
					<Property Name="Text" Value="#{INTERFACE_XML_342}" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Vigor">
						<Property Name="UnifiedPosition" Value="{{1.0,-105.000000},{0.000000,0.000000}}" />
						<Property Name="UnifiedSize" Value="{{0.0,100.000000},{1.000000,0.000000}}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="9999/9999" />
					</Window>
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Energy2_Text">
					<Property Name="AbsolutePosition" Value="x:198.000000 y:302.000000" />
					<Property Name="AbsoluteSize" Value="w:162.000000 h:20.000000" />
					<Property Name="Text" Value="#{INTERFACE_XML_384}" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Energy">
						<Property Name="UnifiedPosition" Value="{{1.0,-105.000000},{0.000000,0.000000}}" />
						<Property Name="UnifiedSize" Value="{{0.0,100.000000},{1.000000,0.000000}}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="9999/9999" />
					</Window>
				</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Energy3_Text">
						<Property Name="UnifiedSize" Value="{{0.000000,324.000000},{0.000000,20.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,36.000000},{0.000000,322.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263"/>
						<Property Name="Text" Value="#{SFJN_231225_5}"/>
						<Property Name="Tooltip" Value="#{SFJN_231225_83}" />
						<Property Name="RiseOnClick" Value="False"/>
						<Window Type="TLBB_SimpleText" Name="SelfEquip_Energy2">
							<Property Name="UnifiedSize" Value="{{0.000000,100.000000},{1.000000,0.000000}}"/>
							<Property Name="UnifiedPosition" Value="{{1.000000,-105.000000},{0.000000,0.000000}}"/>
							<Property Name="TextColor" Value="FFFFF263"/>
							<Property Name="Text" Value="0/2000"/>
							<Property Name="RiseOnClick" Value="False"/>
							<Property Name="HorzFormatting" Value="RightAligned"/>
						</Window>
					</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Exp1_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,288.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,359.000000},{0.000000,302.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_634}" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Exp1">
						<Property Name="UnifiedPosition" Value="{{1.0,-105.000000},{0.000000,0.000000}}" />
						<Property Name="UnifiedSize" Value="{{0.0,100.000000},{1.000000,0.000000}}" />
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="Text" Value="1234567890123" />
						<Property Name="TextColor" Value="FFFFF263" />
					</Window>
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Exp2_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,288.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,359.000000},{0.000000,322.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_835}" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Exp2">
						<Property Name="UnifiedPosition" Value="{{1.0,-105.000000},{0.000000,0.000000}}" />
						<Property Name="UnifiedSize" Value="{{0.0,100.000000},{1.000000,0.000000}}" />
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="Text" Value="123456789" />
						<Property Name="TextColor" Value="FFFFF263" />
					</Window>
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_HP_Text">
					<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,-1.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_805}" />
					<Property Name="TextColor" Value="FFFAFFA4" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_HP">
					<Property Name="UnifiedPosition" Value="{{0.671835,0.000000},{0.000000,0.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.310078,0.000000},{0.000000,18.000000}}" />
					<Property Name="Text" Value="0/0" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_MP_Text">
					<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,18.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_498}" />
					<Property Name="TextColor" Value="FFFAFFA4" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_MP">
					<Property Name="UnifiedPosition" Value="{{0.671835,0.000000},{0.000000,20.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.310078,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_SP_Text">
					<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,37.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_481}" />
					<Property Name="TextColor" Value="FFFAFFA4" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_SP">
					<Property Name="UnifiedPosition" Value="{{0.671835,0.000000},{0.000000,37.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.310078,0.000000},{0.000000,20.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_Frame_Lace2" Name="SelfEquip_Bk2">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,34.000000},{0.000000,91.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,398.000000},{0.000000,59.000000}}"/>
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Str_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,296.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,56.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_429}" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_430}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Str">
					<Property Name="UnifiedPosition" Value="{{0.690537,0.000000},{0.000000,57.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.102302,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Text" Value="99999" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_430}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Str_Plus">
					<Property Name="UnifiedPosition" Value="{{0.792839,0.000000},{0.000000,57.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.117647,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="HorzCentred" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="Text" Value="" />
					<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(1);" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Nimbus_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,296.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,75.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_437}" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_438}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Nimbus">
					<Property Name="UnifiedPosition" Value="{{0.690537,0.000000},{0.000000,76.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.102302,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_438}" />
					<Property Name="Text" Value="99999" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Nimbus_Plus">
					<Property Name="UnifiedPosition" Value="{{0.792839,0.000000},{0.000000,76.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.117647,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="HorzCentred" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="Text" Value="" />
					<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(2);" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_PhysicalStrength_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,296.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,94.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_685}" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_688}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_PhysicalStrength">
					<Property Name="UnifiedPosition" Value="{{0.690537,0.000000},{0.000000,95.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.102302,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_688}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_PhysicalStrength_Plus">
					<Property Name="UnifiedPosition" Value="{{0.792839,0.000000},{0.000000,95.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.117647,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="HorzCentred" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(3);" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Stability_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,296.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,113.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_250}" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_252}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Stability">
					<Property Name="UnifiedPosition" Value="{{0.690537,0.000000},{0.000000,114.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.102302,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_252}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Stability_Plus">
					<Property Name="UnifiedPosition" Value="{{0.792839,0.000000},{0.000000,114.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.117647,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="HorzCentred" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(4);" />
				</Window>
				<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Footwork_Text">
					<Property Name="UnifiedSize" Value="{{0.000000,296.000000},{0.000000,20.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,132.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_628}" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_629}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Footwork">
					<Property Name="UnifiedPosition" Value="{{0.690537,0.000000},{0.000000,133.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.102302,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="TextColor" Value="FFFFF263" />
					<Property Name="Tooltip" Value="#{INTERFACE_XML_629}" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Footwork_Plus">
					<Property Name="UnifiedPosition" Value="{{0.792839,0.000000},{0.000000,133.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.117647,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="HorzCentred" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
					<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(5);" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Potential_Text">
					<Property Name="UnifiedPosition" Value="{{0.520000,10.000000},{0.000000,152.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.12,0.000000},{0.000000,18.000000}}" />
					<Property Name="Text" Value="#{INTERFACE_XML_500}" />
					<Property Name="TextColor" Value="FFFAFFA4" />
					<Property Name="HorzFormatting" Value="LeftAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="RiseOnClick" Value="False" />
				</Window>
				<Window Type="TLBB_SimpleText" Name="SelfEquip_Potential">
					<Property Name="UnifiedPosition" Value="{{0.690537,0.000000},{0.000000,152.000000}}" />
					<Property Name="UnifiedSize" Value="{{0.102302,0.000000},{0.000000,18.000000}}" />
					<Property Name="HorzFormatting" Value="RightAligned" />
					<Property Name="VertFormatting" Value="VertCentred" />
					<Property Name="TextColor" Value="FFFAFFA4" />
					<Property Name="RiseOnClick" Value="False" />
					<Property Name="Text" Value="9999" />
				</Window>
				<Window Type="TLBB_ButtonCommon" Name="SelfEquip_Accept">
					<Property Name="UnifiedSize" Value="{{0.100000,11.899990},{0.000000,18.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,618.000000},{0.000000,151.000000}}"/>
					<Property Name="Text" Value="#{INTERFACE_XML_557}" />
					<Event Name="Clicked" Function="SelfEquip_Accept_Click();" />
				</Window>
				<Window Type="TLBB_Frame_Lace2" Name="SelfEquip_Bk3">
					<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,132.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.520000,0.000000},{0.000000,168.000000}}"/>
					<Property Name="RiseOnClick" Value="False" />
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_1">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,2.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_707}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty1">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,2.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty1_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,2.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
						<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(6);" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_2">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,18.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_471}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty2">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,18.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty2_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,18.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
						<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(7);" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_3">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,34.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_706}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty3">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,34.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty3_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,34.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
						<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(8);" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_4">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,50.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_470}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty4">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,50.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty4_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,50.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
						<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(9);" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_7">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,66.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_468}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty7">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,66.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty7_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,66.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
						<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(10);" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_6">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,82.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_586}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty6">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,82.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty6_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,82.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
						<Event Name="MouseEnter" Function="SelfEquip_ShowTooltip(11);" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_5">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,98.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_338}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty5">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,98.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty5_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,98.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty8">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,98.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty8_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,98.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_PerportyText_9">
						<Property Name="UnifiedSize" Value="{{0.480000,0.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,5.000000},{0.000000,114.000000}}"/>
						<Property Name="Text" Value="#{INTERFACE_XML_337}" />
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
					</Window>
					<Window Type="TLBB_SimpleMulitiTextFrame" Name="SelfEquip_Perporty9">
						<Property Name="UnifiedSize" Value="{{0.000000,192.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.000000,142.000000},{0.000000,114.000000}}"/>
						<Property Name="TextColor" Value="FFFFF263" />
						<Property Name="HorzFormatting" Value="LeftAligned" />
						<Property Name="VertFormatting" Value="VertCentred" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
					<Window Type="TLBB_SimpleText" Name="SelfEquip_Perporty9_Plus">
						<Property Name="UnifiedSize" Value="{{0.000000,46.000000},{0.000000,17.000000}}"/>
						<Property Name="UnifiedPosition" Value="{{0.750000,0.000000},{0.000000,114.000000}}"/>
						<Property Name="HorzFormatting" Value="RightAligned" />
						<Property Name="VertFormatting" Value="BottomAligned" />
						<Property Name="RiseOnClick" Value="False" />
						<Property Name="Text" Value="" />
					</Window>
				</Window>
				<Window Type="TLBB_ButtonAdd" Name="Equip_Addition_Button1">
					<Property Name="UnifiedPosition" Value="{{0.000000,664.000000},{0.000000,59.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(1);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(1)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(1)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(1)" />
				</Window>
				<Window Type="TLBB_ButtonAdd" Name="Equip_Addition_Button2">
					<Property Name="UnifiedPosition" Value="{{0.000000,664.000000},{0.000000,78.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(2);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(2)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(2)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(2)" />
				</Window>
				<Window Type="TLBB_ButtonAdd" Name="Equip_Addition_Button3">
					<Property Name="UnifiedPosition" Value="{{0.000000,664.000000},{0.000000,97.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(3);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(3)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(3)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(3)" />
				</Window>
				<Window Type="TLBB_ButtonAdd" Name="Equip_Addition_Button4">
					<Property Name="UnifiedPosition" Value="{{0.000000,664.000000},{0.000000,116.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(4);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(4)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(4)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(4)" />
				</Window>
				<Window Type="TLBB_ButtonAdd" Name="Equip_Addition_Button5">
					<Property Name="UnifiedPosition" Value="{{0.000000,664.000000},{0.000000,135.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(5);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(5)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(5)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(5)" />
				</Window>
				<Window Type="TLBB_ButtonSub" Name="Equip_Decrease_Button1">
					<Property Name="UnifiedPosition" Value="{{0.000000,685.000000},{0.000000,59.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(6);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(6)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(6)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(6)" />
				</Window>
				<Window Type="TLBB_ButtonSub" Name="Equip_Decrease_Button2">
					<Property Name="UnifiedPosition" Value="{{0.000000,685.000000},{0.000000,78.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(7);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(7)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(7)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(7)" />
				</Window>
				<Window Type="TLBB_ButtonSub" Name="Equip_Decrease_Button3">
					<Property Name="UnifiedPosition" Value="{{0.000000,685.000000},{0.000000,97.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(8);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(8)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(8)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(8)" />
				</Window>
				<Window Type="TLBB_ButtonSub" Name="Equip_Decrease_Button4">
					<Property Name="UnifiedPosition" Value="{{0.000000,685.000000},{0.000000,116.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(9);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(9)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(9)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(9)" />
				</Window>
				<Window Type="TLBB_ButtonSub" Name="Equip_Decrease_Button5">
					<Property Name="UnifiedPosition" Value="{{0.000000,685.000000},{0.000000,135.000000}}" />
					<Property Name="AbsoluteSize" Value="w:14.000000 h:14.000000" />
					<Event Name="Clicked" Function="SelfEquip_AutoClick_LButtonUp(10);" />
					<Event Name="MouseEnter" Function="SelfEquip_AutoClick_Clear(10)" />
					<Event Name="MouseLeave" Function="SelfEquip_AutoClick_Clear(10)" />
					<Event Name="MouseLButtonDown"  Function="SelfEquip_AutoClick_SetTimer(10)" />
				</Window>
			</Window>
			<Window Type="DefaultWindow" Name="SelfEquip_Checkbox_Frame">
				<Property Name="UnifiedSize" Value="{{0.933333,0.000000},{0.000000,24.000000}}"/>
				<Property Name="UnifiedPosition" Value="{{0.000000,8.000000},{1.000000,-25.000000}}"/>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_SelfEquip">
					<Property Name="AbsolutePosition" Value="x:0.0 y:0.0" />
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="CheckMode" Value="1" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Property Name="Text" Value="#{INTERFACE_XML_877}" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(1);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_SelfEquip_Mask">
					<Property Name="AbsolutePosition" Value="x:0.0 y:0.0" />
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_SelfEquip_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,33.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_SelfData">
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,42.000000},{0.000000,0.000000}}"/>
					<Property Name="CheckMode" Value="1" />
					<Property Name="Text" Value="#{INTERFACE_XML_882}" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(2);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_SelfData_Mask">
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,42.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_SelfData_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,85.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Pet">
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,84.000000},{0.000000,0.000000}}"/>
					<Property Name="CheckMode" Value="1" />
					<Property Name="Text" Value="#{INTERFACE_XML_854}" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(3);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Pet_Mask">
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,84.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Pet_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,127.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Wuhun">
					<Property Name="UnifiedSize" Value="{{0.000000,55.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,126.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{WH_xml_XX(95)}" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(4);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Wuhun_Mask">
					<Property Name="UnifiedSize" Value="{{0.000000,55.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,126.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Wuhun_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,182.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Xiulian">
					<Property Name="UnifiedSize" Value="{{0.000000,60.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,181.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{XL_XML_35}" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(5);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Xiulian_Mask">
					<Property Name="UnifiedSize" Value="{{0.000000,60.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,181.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Xiulian_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,242.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Talent">
					<Property Name="UnifiedSize" Value="{{0.000000,55.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,241.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{TalentMP_20210804_57}" />
					<Property Name="CheckMode" Value="1" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(6);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Talent_Mask">
					<Property Name="UnifiedSize" Value="{{0.000000,55.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,241.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Talent_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,296.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Lingyu">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,60.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,296.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{SZXT_221216_22}" />
					<Property Name="CheckMode" Value="1" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(7);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Lingyu_Mask">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,60.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,296.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Lingyu_tips">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,356.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Weapon2">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,63.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,356.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{SBFW_20230707_1}"/>
					<Property Name="CheckMode" Value="1" />
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(8);"/>
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Weapon2_Mask">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,63.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,356.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Weapon2_tips">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,419.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_DWJinJie">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,63.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,419.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{DWJJ_240329_153}" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Property Name="CheckMode" Value="1" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(9);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_DWJinJie_Mask">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,63.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,419.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_DWJinJie_tips">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,482.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_Profile">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,85.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,482.000000},{0.000000,0.000000}}"/>
					<Property Name="Text" Value="#{GRYM_221213_22}" />
					<Property Name="CheckMode" Value="1" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(10);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_Profile_Mask">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,85.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,482.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_Profile_tips">
					<Property Name="Visible" Value="False"/>
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,567.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
				<Window Type="TLBB_ButtonPageDown" Name="SelfEquip_OtherInfo">
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,296.000000},{0.000000,0.000000}}"/>
					<!-- <Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/> -->
					<!-- <Property Name="UnifiedPosition" Value="{{0.000000,567.000000},{0.000000,0.000000}}"/> -->
					<Property Name="Text" Value="#{INTERFACE_XML_496}" />
					<Property Name="CheckMode" Value="1" />
					<Property Name="MouseRButtonHollow" Value="true" />
					<Event Name="MouseButtonUp" Function="SelfEquip_OnPageClicked(11);" />
				</Window>
				<Window Type="DefaultWindow" Name="SelfEquip_OtherInfo_Mask">
					<Property Name="UnifiedSize" Value="{{0.000000,42.000000},{0.000000,24.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,567.000000},{0.000000,0.000000}}"/>
					<Property Name="AlwaysOnTop" Value="True" />
					<Property Name="Visible" Value="False" />
				</Window>
				<Window Type="TLBB_StaticImageNULL" Name="SelfEquip_OtherInfo_tips">
					<Property Name="UnifiedSize" Value="{{0.000000,10.000000},{0.000000,10.000000}}"/>
					<Property Name="UnifiedPosition" Value="{{0.000000,609.000000},{0.000000,0.000000}}"/>
					<Property Name="MouseRButtonHollow" Value="True"/>
					<Property Name="MouseMoveHollow" Value="True"/>
					<Property Name="MouseLButtonHollow" Value="True"/>
					<Property Name="MouseHollow" Value="True"/>
					<Property Name="Image" Value="set:UIIcons image:Map_Trip"/>
					<Property Name="AlwaysOnTop" Value="True"/>
				</Window>
			</Window>
		</Window>
		<Window Type="TLBB_Animate" Name="SelfEquip_Levelup_Mask">
			<Property Name="UnifiedPosition" Value="{{1.0,-46.000000},{1.0,-63.000000}}" />
			<Property Name="UnifiedSize" Value="{{0.0,23.000000},{0.000000,57.000000}}" />
			<Property Name="Animate" Value="Levelup" />
			<Property Name="MouseHollow" Value="true" />
			<Property Name="MouseMoveHollow" Value="true" />
			<Property Name="MouseLButtonHollow" Value="true" />
			<Property Name="MouseRButtonHollow" Value="true" />
			<Property Name="AlwaysOnTop" Value="True" />
		</Window>
		<Window Type="TLBB_ButtonNULL" Name="SelfEquip_UpLevel">
			<Property Name="UnifiedPosition" Value="{{1.0,-64.000000},{1.0,-76.000000}}" />
			<Property Name="UnifiedSize" Value="{{0.0,60.000000},{0.000000,71.000000}}" />
			<Property Name="Tooltip" Value="#{JZSJ_220321_01}"/>
			<Event Name="Clicked" Function="SelfEquip_AskLevelup();" />
			<Property Name="NormalImage" Value="set:Button5 image:BtnLevelup_Normal" />
			<Property Name="HoverImage" Value="set:Button5 image:BtnLevelup_Hover" />
			<Property Name="PushedImage" Value="set:Button5 image:BtnLevelup_Pushed" />
			<Property Name="DisabledImage" Value="set:Button5 image:BtnLevelup_Disabled" />
			<Property Name="AlwaysOnTop" Value="True" />
		</Window>
	</Window>
</GUILayout>`;
