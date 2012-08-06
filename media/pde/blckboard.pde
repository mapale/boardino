// Post-it WhiteBoard
/* @pjs preload="/media/postit.gif"; */
String postit_image_url = "/media/postit.gif";
HashMap postits;
PostIt selectedPostIt;
Tool currentTool;
JavaScript javaScript;

interface JavaScript{
    void onNewPostit(float x, float y, String feed);
    void onPostitMoved(int id, float x, float y);
    void onPostitSelected(int id);
    void onPostitDeselected(int id);
}

interface Tool {
    public void mouseDragged();
    public void keyPressed();
    public void mousePressed();
}

private void setup(){
    size(window.innerWidth, window.innerHeight);
    frameRate(15);
    postits = new HashMap();
    loadBoard();
    currentTool = new PostitTool(postits, selectedPostIt);
}

private void draw(){
    background(59,101,61);
    Iterator i = postits.entrySet().iterator();
    while (i.hasNext()) {
        Map.Entry entry = (Map.Entry)i.next();
        PostIt postit = (PostIt)entry.getValue();
        postit.show();
    }
}

/**Processing events**/
private void mousePressed(){
    currentTool.mousePressed();
}

private void mouseDragged(){
    currentTool.mouseDragged();
}

private void keyPressed(){
    currentTool.keyPressed();
}
/**End of processing events**/

public void bindJavaScript(JavaScript js){
    javaScript = js;
}

public void addPostIt(int id, String text, int x, int y){
    postits.put(id, new PostIt(id, text, x, y));
}

public void movePostIt(int id, int x, int y){
    PostIt postit = (PostIt) postits.get(id);
    postit.move(x, y);
}

private void createPostIt(){
    PostIt postit = postits.get(9999);
    javaScript.onNewPostit(postit.x, postit.y, postit.feed);
    postits.remove(9999);
}

public void friendSelectPostit(int postitId){
    PostIt postit = (PostIt) postits.get(postitId);
    postit.friendSelect();
}

public void friendDeselectPostit(int postitId){
    PostIt postit = (PostIt) postits.get(postitId);
    postit.friendDeselect();
}